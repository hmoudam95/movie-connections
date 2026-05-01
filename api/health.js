const neo4j = require('neo4j-driver');

let driver;
function getDriver() {
  if (driver) return driver;
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  if (!uri || !user || !password) return null;
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  return driver;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const d = getDriver();
  if (!d) {
    return res.status(200).json({ ok: false, neo4j: 'unconfigured' });
  }

  const session = d.session({ defaultAccessMode: neo4j.session.READ });
  try {
    await session.run('RETURN 1 AS ok');
    return res.status(200).json({ ok: true, neo4j: 'reachable' });
  } catch (err) {
    return res.status(200).json({ ok: false, neo4j: 'error' });
  } finally {
    await session.close();
  }
}
