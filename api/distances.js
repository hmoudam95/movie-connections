// api/distances.js — the compass engine.
//
// Given the target movie and a list of candidate movie ids, returns each one's
// shortest distance (in movie-hops) to the target. The client colors the route
// strings from this: closer = greener, farther = redder, no-path = dead end.
//
// GET /api/distances?toMovieId=<id>&ids=<id,id,...>  ->  { toMovieId, dist: { id: hops | -1 } }
//   hops 0   = this IS the target
//   hops > 0 = shortest movie-hops to the target
//   -1       = no known path (movie absent from the graph, or unreachable) → dead end
//
// No TMDB upsert here (kept fast): movies not already in Neo4j return -1, which
// the UI renders as a neutral "unknown" rather than a false red.
const neo4j = require('neo4j-driver');

let driver;
function getDriver() {
  if (driver) return driver;
  const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) return null;
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  return driver;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  const { toMovieId } = req.query;
  const idsRaw = req.query.ids || '';
  if (!toMovieId || !/^\d{1,8}$/.test(toMovieId)) {
    return res.status(400).json({ error: 'valid toMovieId required' });
  }
  const ids = String(idsRaw)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d{1,8}$/.test(s))
    .slice(0, 40);
  if (!ids.length) return res.status(400).json({ error: 'ids required' });

  const d = getDriver();
  if (!d) return res.status(500).json({ error: 'neo4j unconfigured' });

  const session = d.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(
      `MATCH (t:Movie {id: $to})
       UNWIND $ids AS mid
       OPTIONAL MATCH (src:Movie {id: mid})
       OPTIONAL MATCH p = shortestPath((src)-[:ACTED_IN*0..8]-(t))
       RETURN mid AS id, CASE WHEN p IS NULL THEN -1 ELSE length(p) / 2 END AS dist`,
      { to: toMovieId, ids }
    );
    const dist = {};
    result.records.forEach((rec) => {
      const v = rec.get('dist');
      dist[rec.get('id')] = typeof v === 'number' ? v : (v && v.toNumber ? v.toNumber() : -1);
    });
    return res.status(200).json({ toMovieId, dist });
  } catch (err) {
    console.error('[distances]', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
}
