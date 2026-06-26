// populate.js — Unified, resumable TMDB → Neo4j loader.
//
// Supersedes populateDatabase.js (local) and populateAuraDatabase.js (cloud):
// it targets whatever NEO4J_URI points at, so the same script fills a local
// Neo4j or an AuraDB cloud instance. Safe to re-run — it is idempotent and
// SKIPS movies whose cast is already in the graph, so repeated runs add new
// movies without re-hitting TMDB for ones you already have.
//
// Improvements over the originals:
//   • Deeper crawl (PAGES configurable, default 50 ≈ 1000 movies vs the old 10)
//   • Skip-already-loaded   → far fewer TMDB calls + Aura writes on re-runs
//   • Batched writes (UNWIND) → one Neo4j round-trip per movie, not 1 + N
//   • Concurrent detail fetches with 429 back-off
//   • Ensures indexes first, so MERGE stays fast as the graph grows
//
// Usage:
//   node populate.js                         # 50 pages, top-20 billed cast
//   PAGES=200 node populate.js               # crawl much deeper
//   START_PAGE=51 PAGES=50 node populate.js  # resume where a run left off
//   MIN_VOTES=300 node populate.js           # widen to less-famous films
//   CAST_LIMIT=0 node populate.js            # store the full cast (denser graph)
//   DRY_RUN=1 node populate.js               # log what it would do, write nothing
//
// Env (from .env in project root): TMDB_API_KEY, NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
require('dotenv').config();
const neo4j = require('neo4j-driver');
const fetch = require('node-fetch');

const TMDB = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

const PAGES = Number(process.env.PAGES || 50);
const START_PAGE = Number(process.env.START_PAGE || 1);
const MIN_VOTES = Number(process.env.MIN_VOTES || 1000);
const SORT_BY = process.env.SORT_BY || 'popularity.desc';
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const CAST_LIMIT = Number(process.env.CAST_LIMIT ?? 20); // 0 = all billed cast
const DRY_RUN = !!process.env.DRY_RUN;

function assertEnv() {
  const missing = ['TMDB_API_KEY', 'NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD']
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`❌ Missing env vars: ${missing.join(', ')}. Add them to .env`);
    process.exit(1);
  }
}

const driver = () => neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// fetch JSON with retry/back-off on 429 (rate limit) and transient 5xx.
async function fetchJson(url, attempt = 1) {
  const resp = await fetch(url);
  if (resp.status === 429 || resp.status >= 500) {
    if (attempt > 5) throw new Error(`TMDB ${resp.status} after ${attempt} tries`);
    const retryAfter = Number(resp.headers.get('retry-after')) || attempt * 2;
    await sleep(retryAfter * 1000);
    return fetchJson(url, attempt + 1);
  }
  if (!resp.ok) throw new Error(`TMDB ${resp.status} ${resp.statusText} for ${url}`);
  return resp.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// run an async fn over items with a fixed-size worker pool.
async function pool(items, size, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

const discoverMovies = (page) => fetchJson(
  `${TMDB}/discover/movie?api_key=${API_KEY}` +
  `&sort_by=${SORT_BY}&vote_count.gte=${MIN_VOTES}&page=${page}`
).then((d) => d.results || []);

const movieDetails = (id) => fetchJson(
  `${TMDB}/movie/${id}?api_key=${API_KEY}&append_to_response=credits`
);

// Of the given movie ids, return the set already connected to ≥1 actor — those
// we can skip entirely (no TMDB detail call, no write). Catches movies loaded by
// any previous script, not just this one.
async function alreadyLoaded(session, ids) {
  const res = await session.run(
    `UNWIND $ids AS id
     MATCH (m:Movie {id: id})<-[:ACTED_IN]-(:Actor)
     RETURN collect(DISTINCT id) AS loaded`,
    { ids }
  );
  return new Set(res.records[0]?.get('loaded') || []);
}

// One round-trip: upsert the movie + its cast + relationships.
async function upsertMovie(session, movie, details) {
  let cast = details.credits?.cast || [];
  if (CAST_LIMIT > 0) cast = cast.slice(0, CAST_LIMIT);
  const castParam = cast.map((a) => ({
    id: a.id.toString(),
    name: a.name,
    profile: a.profile_path ?? null,
  }));
  await session.run(
    `MERGE (m:Movie {id: $id})
       SET m.title = $title, m.poster_path = $poster,
           m.release_date = $release, m.vote_count = $votes,
           m.popularity = $popularity, m.cast_loaded = true
     WITH m
     UNWIND $cast AS c
       MERGE (a:Actor {id: c.id})
         SET a.name = c.name, a.profile_path = c.profile
       MERGE (a)-[:ACTED_IN]->(m)`,
    {
      id: movie.id.toString(),
      title: movie.title ?? details.title ?? null,
      poster: movie.poster_path ?? null,
      release: movie.release_date ?? null,
      votes: neo4j.int(movie.vote_count || 0),
      popularity: movie.popularity || 0,
      cast: castParam,
    }
  );
  return castParam.length;
}

async function ensureIndexes(session) {
  await session.run('CREATE INDEX movie_id IF NOT EXISTS FOR (m:Movie) ON (m.id)');
  await session.run('CREATE INDEX actor_id IF NOT EXISTS FOR (a:Actor) ON (a.id)');
}

const fmt = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : m ? `${m}m ${s % 60}s` : `${s}s`;
};

async function main() {
  assertEnv();
  const d = driver();
  const session = d.session();
  const start = Date.now();
  let added = 0, skipped = 0, rels = 0, failed = 0;

  console.log(`🚀 populate.js → ${process.env.NEO4J_URI}`);
  console.log(`   pages ${START_PAGE}..${START_PAGE + PAGES - 1} · min votes ${MIN_VOTES} · ` +
    `cast ${CAST_LIMIT || 'all'} · concurrency ${CONCURRENCY}${DRY_RUN ? ' · DRY RUN' : ''}\n`);

  try {
    if (!DRY_RUN) await ensureIndexes(session);

    for (let p = START_PAGE; p < START_PAGE + PAGES; p++) {
      let movies;
      try {
        movies = await discoverMovies(p);
      } catch (e) {
        console.error(`❌ page ${p}: ${e.message}`);
        continue;
      }
      if (!movies.length) { console.log(`📄 page ${p}: empty, stopping.`); break; }

      const ids = movies.map((m) => m.id.toString());
      const loaded = DRY_RUN ? new Set() : await alreadyLoaded(session, ids);
      const todo = movies.filter((m) => !loaded.has(m.id.toString()));
      skipped += movies.length - todo.length;

      await pool(todo, CONCURRENCY, async (movie) => {
        try {
          const details = await movieDetails(movie.id);
          if (DRY_RUN) { added++; return; }
          const n = await upsertMovie(session, movie, details);
          added++; rels += n;
        } catch (e) {
          failed++;
          console.error(`   ⚠️  "${movie.title}" (${movie.id}): ${e.message}`);
        }
      });

      const eta = (Date.now() - start) / (p - START_PAGE + 1) * (PAGES - (p - START_PAGE + 1));
      console.log(`📄 page ${p}/${START_PAGE + PAGES - 1} · +${todo.length} new, ` +
        `${movies.length - todo.length} skipped · totals: ${added} movies, ${rels} links · ETA ${fmt(eta)}`);
    }

    console.log(`\n🎉 Done in ${fmt(Date.now() - start)}`);
    console.log(`   movies added/updated: ${added} · skipped (already loaded): ${skipped}`);
    console.log(`   relationships written: ${rels} · failures: ${failed}`);
  } finally {
    await session.close();
    await d.close();
  }
}

main().catch((e) => { console.error('💥 Fatal:', e); process.exit(1); });
