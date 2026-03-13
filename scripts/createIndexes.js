// createIndexes.js — Run once to create Neo4j indexes for fast lookups
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function createIndexes() {
  const session = driver.session();
  try {
    console.log('Creating indexes...');

    await session.run('CREATE INDEX movie_id IF NOT EXISTS FOR (m:Movie) ON (m.id)');
    console.log('  Movie.id index created');

    await session.run('CREATE INDEX actor_id IF NOT EXISTS FOR (a:Actor) ON (a.id)');
    console.log('  Actor.id index created');

    console.log('Done. All indexes created.');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

createIndexes();
