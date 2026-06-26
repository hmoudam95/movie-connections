// api/daily.js — Returns today's Daily Connection puzzle.
//
// Deterministic by UTC date: everyone gets the same start/target on a given
// day. Pairs are hand-curated (recognizable movies that connect well); par
// (the optimal number of moves) is computed live via the same Neo4j
// shortestPath the hint system uses, so we don't have to precompute it.
//
// GET /api/daily  ->  { puzzleNumber, date, start, target, par }
const neo4j = require('neo4j-driver');

// Curated pairs: [startTmdbId, targetTmdbId]. Grow this list over time — the
// endpoint cycles through it by day, so N pairs = N days before it repeats.
const PUZZLES = [
  [27205, 680],     // Inception -> Pulp Fiction
  [155, 597],       // The Dark Knight -> Titanic
  [603, 13],        // The Matrix -> Forrest Gump
  [550, 238],       // Fight Club -> The Godfather
  [157336, 98],     // Interstellar -> Gladiator
  [68718, 769],     // Django Unchained -> Goodfellas
  [106646, 278],    // The Wolf of Wall Street -> The Shawshank Redemption
  [19995, 1422],    // Avatar -> The Departed
  [475557, 313369], // Joker -> La La Land
  [496243, 244786], // Parasite -> Whiplash
  [37799, 76341],   // The Social Network -> Mad Max: Fury Road
  [329, 24428],     // Jurassic Park -> The Avengers
  [807, 12445],     // Se7en -> Harry Potter (Deathly Hallows 2)
  [120, 1726],      // LOTR: Fellowship -> Iron Man
  [11, 1893],       // Star Wars -> The Phantom Menace
  [85, 22],         // Indiana Jones -> Pirates of the Caribbean
  [1124, 4922],     // The Prestige -> The Curious Case of Benjamin Button
  [194, 274],       // Amélie -> The Silence of the Lambs
  [10681, 62],      // WALL-E -> 2001: A Space Odyssey
  [641, 14160],     // Requiem for a Dream -> Up
];

let driver;
function getDriver() {
  if (driver) return driver;
  const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) return null;
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  return driver;
}

// Upsert a movie + its cast from TMDB, unless it's already in the graph.
async function ensureMovie(session, id) {
  const existing = await session.run(
    `MATCH (m:Movie {id: $id})
     OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
     RETURN m IS NOT NULL AS exists, count(a) AS castCount`,
    { id }
  );
  const row = existing.records[0];
  if (row && row.get('exists') && row.get('castCount').toNumber() > 0) return;

  if (!process.env.TMDB_API_KEY) throw new Error('TMDB_API_KEY not configured');
  const resp = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`
  );
  if (!resp.ok) throw new Error(`TMDB ${resp.status} for movie ${id}`);
  const { title, poster_path, release_date, credits } = await resp.json();
  await session.run(
    `MERGE (m:Movie {id: $id})
       SET m.title=$title, m.poster_path=$poster, m.release_date=$release
     WITH m
     UNWIND $cast AS c
       MERGE (a:Actor {id: c.id}) SET a.name=c.name, a.profile_path=c.profile
       MERGE (a)-[:ACTED_IN]->(m)`,
    {
      id, title, poster: poster_path ?? null, release: release_date ?? null,
      cast: (credits?.cast || []).map((a) => ({ id: a.id.toString(), name: a.name, profile: a.profile_path ?? null })),
    }
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const d = getDriver();
  if (!d) return res.status(500).json({ error: 'neo4j unconfigured' });

  const dayNumber = Math.floor(Date.now() / 86400000); // days since epoch (UTC)
  const [startId, targetId] = PUZZLES[dayNumber % PUZZLES.length].map(String);

  const write = d.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    await ensureMovie(write, startId);
    await ensureMovie(write, targetId);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load puzzle movies', detail: err.message });
  } finally {
    await write.close();
  }

  const read = d.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const props = await read.run(
      `UNWIND $ids AS id
       MATCH (m:Movie {id: id})
       RETURN m.id AS id, m.title AS title, m.poster_path AS poster_path, m.release_date AS release_date`,
      { ids: [startId, targetId] }
    );
    const byId = {};
    props.records.forEach((r) => {
      byId[r.get('id')] = {
        id: r.get('id'), title: r.get('title'),
        poster_path: r.get('poster_path'), release_date: r.get('release_date'),
      };
    });

    let par = null;
    const path = await read.run(
      `MATCH (s:Movie {id:$from}), (e:Movie {id:$to})
       MATCH p = shortestPath((s)-[:ACTED_IN*1..8]-(e))
       RETURN length(p) AS len`,
      { from: startId, to: targetId }
    );
    if (path.records.length) {
      // path alternates Movie-Actor-Movie...; moves = number of movie hops
      par = Math.floor(path.records[0].get('len').toNumber() / 2);
    }

    return res.status(200).json({
      puzzleNumber: dayNumber,
      date: new Date(dayNumber * 86400000).toISOString().slice(0, 10),
      start: byId[startId] || { id: startId },
      target: byId[targetId] || { id: targetId },
      par,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to build daily puzzle', detail: err.message });
  } finally {
    await read.close();
  }
}
