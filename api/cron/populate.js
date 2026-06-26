// api/cron/populate.js — Vercel Cron: incremental TMDB → Neo4j loader.
//
// Runs serverless on Vercel (no laptop needed). Each invocation is time-boxed
// (serverless functions have a hard duration cap), so instead of crawling
// everything at once it advances a cursor a few pages per run and stops before
// the deadline. Over repeated runs the graph fills in; once a page's movies are
// already loaded it skips them (no TMDB call, no write), so re-runs are cheap.
//
// Cursor: a single (:Meta {key:'populate'}) node holding `nextPage`.
//
// Schedule + function limits are configured in vercel.json (crons + functions).
//
// Security: when CRON_SECRET is set (Vercel sets the `Authorization: Bearer
// <CRON_SECRET>` header on cron invocations automatically), requests without it
// are rejected — so the endpoint can't be hammered by randoms. Add CRON_SECRET
// to your Vercel project env vars.
const neo4j = require('neo4j-driver');

const MIN_VOTES = Number(process.env.POPULATE_MIN_VOTES || 1000);
const CAST_LIMIT = Number(process.env.POPULATE_CAST_LIMIT || 15); // 0 = all
const CONCURRENCY = Number(process.env.POPULATE_CONCURRENCY || 4);
const MAX_PAGES = Number(process.env.POPULATE_MAX_PAGES || 200); // wrap after this
const PAGES_PER_RUN = Number(process.env.POPULATE_PAGES_PER_RUN || 4);
const DEADLINE_MS = Number(process.env.POPULATE_DEADLINE_MS || 50000); // < maxDuration

let driver;
function getDriver() {
  if (driver) return driver;
  const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) return null;
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  return driver;
}

const TMDB = 'https://api.themoviedb.org/3';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, attempt = 1) {
  const resp = await fetch(url);
  if (resp.status === 429 || resp.status >= 500) {
    if (attempt > 4) throw new Error(`TMDB ${resp.status}`);
    const wait = Number(resp.headers.get('retry-after')) || attempt * 2;
    await sleep(wait * 1000);
    return fetchJson(url, attempt + 1);
  }
  if (!resp.ok) throw new Error(`TMDB ${resp.status}`);
  return resp.json();
}

async function pool(items, size, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const idx = i++; await fn(items[idx]); }
  });
  await Promise.all(workers);
}

async function getCursor(session) {
  const r = await session.run(
    `MERGE (m:Meta {key:'populate'})
     ON CREATE SET m.nextPage = 1
     RETURN coalesce(m.nextPage, 1) AS nextPage`
  );
  return r.records[0].get('nextPage').toNumber ? r.records[0].get('nextPage').toNumber() : Number(r.records[0].get('nextPage'));
}

async function setCursor(session, nextPage) {
  await session.run(
    `MERGE (m:Meta {key:'populate'}) SET m.nextPage = $n, m.updatedAt = timestamp()`,
    { n: neo4j.int(nextPage) }
  );
}

async function alreadyLoaded(session, ids) {
  const res = await session.run(
    `UNWIND $ids AS id
     MATCH (m:Movie {id: id})<-[:ACTED_IN]-(:Actor)
     RETURN collect(DISTINCT id) AS loaded`,
    { ids }
  );
  return new Set(res.records[0]?.get('loaded') || []);
}

async function upsertMovie(session, movie, details) {
  let cast = details.credits?.cast || [];
  if (CAST_LIMIT > 0) cast = cast.slice(0, CAST_LIMIT);
  const castParam = cast.map((a) => ({ id: a.id.toString(), name: a.name, profile: a.profile_path ?? null }));
  await session.run(
    `MERGE (m:Movie {id: $id})
       SET m.title=$title, m.poster_path=$poster, m.release_date=$release,
           m.vote_count=$votes, m.popularity=$popularity, m.cast_loaded=true
     WITH m
     UNWIND $cast AS c
       MERGE (a:Actor {id: c.id}) SET a.name=c.name, a.profile_path=c.profile
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Auth: in production, require the cron secret (Vercel injects it as a Bearer).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!process.env.TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
  }
  const d = getDriver();
  if (!d) return res.status(500).json({ error: 'neo4j unconfigured' });

  const start = Date.now();
  const session = d.session({ defaultAccessMode: neo4j.session.WRITE });
  let added = 0, skipped = 0, rels = 0, failed = 0, pagesRun = 0;
  let page;
  try {
    page = await getCursor(session);
    const firstPage = page;

    while (pagesRun < PAGES_PER_RUN && Date.now() - start < DEADLINE_MS) {
      let movies;
      try {
        movies = await fetchJson(
          `${TMDB}/discover/movie?api_key=${process.env.TMDB_API_KEY}` +
          `&sort_by=popularity.desc&vote_count.gte=${MIN_VOTES}&page=${page}`
        ).then((j) => j.results || []);
      } catch (e) { failed++; break; }

      if (!movies.length || page > MAX_PAGES) { page = 1; break; }

      const ids = movies.map((m) => m.id.toString());
      const loaded = await alreadyLoaded(session, ids);
      const todo = movies.filter((m) => !loaded.has(m.id.toString()));
      skipped += movies.length - todo.length;

      await pool(todo, CONCURRENCY, async (movie) => {
        if (Date.now() - start > DEADLINE_MS) return;
        try {
          const details = await fetchJson(
            `${TMDB}/movie/${movie.id}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`
          );
          rels += await upsertMovie(session, movie, details);
          added++;
        } catch (e) { failed++; }
      });

      page = page + 1 > MAX_PAGES ? 1 : page + 1;
      pagesRun++;
    }

    await setCursor(session, page);
    return res.status(200).json({
      ok: true, pagesRun, nextPage: page,
      moviesAdded: added, skipped, relationshipsWritten: rels, failed,
      elapsedMs: Date.now() - start,
    });
  } catch (err) {
    console.error('[cron/populate]', err.message);
    return res.status(500).json({ error: err.message, page, added, rels });
  } finally {
    await session.close();
  }
}
