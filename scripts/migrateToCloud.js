// migrateToCloud.js — Batched UNWIND migration
require('dotenv').config();
const neo4j = require('neo4j-driver');

const localDriver = neo4j.driver(
    process.env.LOCAL_NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.LOCAL_NEO4J_USER || 'neo4j',
        process.env.LOCAL_NEO4J_PASSWORD || 'your_password'
    )
);

const cloudDriver = neo4j.driver(
    process.env.CLOUD_NEO4J_URI,
    neo4j.auth.basic(
        process.env.CLOUD_NEO4J_USER,
        process.env.CLOUD_NEO4J_PASSWORD
    )
);

function toNative(val) {
    if (val === null || val === undefined) return val;
    if (neo4j.isInt(val)) return val.toNumber();
    return val;
}

async function runBatched(session, query, items, batchSize, label) {
    const total = items.length;
    for (let i = 0; i < total; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await session.run(query, { batch });
        const done = Math.min(i + batchSize, total);
        console.log(`   ${label}: ${done}/${total} (${Math.round(done / total * 100)}%)`);
    }
}

async function migrateData() {
    const localSession = localDriver.session();
    let cloudSession = cloudDriver.session();

    try {
        // --- Export from local ---
        console.log('📤 Exporting from local Neo4j...');

        const moviesResult = await localSession.run(
            'MATCH (m:Movie) RETURN m.id as id, m.title as title, m.poster_path as poster_path, m.release_date as release_date'
        );
        const movies = moviesResult.records.map(r => ({
            id: toNative(r.get('id')),
            title: r.get('title'),
            poster_path: r.get('poster_path'),
            release_date: r.get('release_date')
        }));
        console.log(`   Movies: ${movies.length}`);

        const actorsResult = await localSession.run(
            'MATCH (a:Actor) RETURN a.id as id, a.name as name, a.profile_path as profile_path'
        );
        const actors = actorsResult.records.map(r => ({
            id: toNative(r.get('id')),
            name: r.get('name'),
            profile_path: r.get('profile_path')
        }));
        console.log(`   Actors: ${actors.length}`);

        const relsResult = await localSession.run(
            'MATCH (a:Actor)-[:ACTED_IN]->(m:Movie) RETURN a.id as actorId, m.id as movieId'
        );
        const relationships = relsResult.records.map(r => ({
            actorId: toNative(r.get('actorId')),
            movieId: toNative(r.get('movieId'))
        }));
        console.log(`   Relationships: ${relationships.length}`);

        const localTotal = movies.length + actors.length;
        console.log(`   Total nodes: ${localTotal}, Total rels: ${relationships.length}`);

        // --- Clear cloud ---
        console.log('\n🗑️  Clearing cloud database...');
        // Delete in batches to avoid memory issues
        let deleted = 0;
        while (true) {
            const res = await cloudSession.run(
                'MATCH (n) WITH n LIMIT 10000 DETACH DELETE n RETURN count(*) as deleted'
            );
            const count = res.records[0].get('deleted').toNumber();
            deleted += count;
            if (count > 0) console.log(`   Deleted ${deleted} nodes so far...`);
            if (count < 10000) break;
        }
        console.log(`   Cloud cleared (${deleted} nodes removed)`);

        // Close and reopen session after bulk delete
        await cloudSession.close();
        cloudSession = cloudDriver.session();

        // --- Create indexes first ---
        console.log('\n📇 Creating indexes on cloud...');
        try {
            await cloudSession.run('CREATE INDEX movie_id IF NOT EXISTS FOR (m:Movie) ON (m.id)');
            await cloudSession.run('CREATE INDEX actor_id IF NOT EXISTS FOR (a:Actor) ON (a.id)');
            console.log('   Indexes created');
        } catch (e) {
            console.log('   Indexes may already exist:', e.message);
        }

        // Wait a moment for indexes to come online
        await new Promise(r => setTimeout(r, 3000));

        // --- Import movies ---
        console.log('\n📥 Importing movies (batch size 1000)...');
        await runBatched(cloudSession, `
            UNWIND $batch AS row
            MERGE (m:Movie {id: row.id})
            SET m.title = row.title,
                m.poster_path = row.poster_path,
                m.release_date = row.release_date
        `, movies, 1000, 'Movies');

        // --- Import actors ---
        console.log('\n📥 Importing actors (batch size 1000)...');
        await runBatched(cloudSession, `
            UNWIND $batch AS row
            MERGE (a:Actor {id: row.id})
            SET a.name = row.name,
                a.profile_path = row.profile_path
        `, actors, 1000, 'Actors');

        // --- Import relationships ---
        console.log('\n📥 Importing relationships (batch size 500)...');
        await runBatched(cloudSession, `
            UNWIND $batch AS row
            MATCH (a:Actor {id: row.actorId})
            MATCH (m:Movie {id: row.movieId})
            MERGE (a)-[:ACTED_IN]->(m)
        `, relationships, 500, 'Rels');

        // --- Verify ---
        console.log('\n🔍 Verifying migration...');
        const cMovies = await cloudSession.run('MATCH (m:Movie) RETURN count(m) as count');
        const cActors = await cloudSession.run('MATCH (a:Actor) RETURN count(a) as count');
        const cRels = await cloudSession.run('MATCH ()-[r:ACTED_IN]->() RETURN count(r) as count');

        const cloudMovies = cMovies.records[0].get('count').toNumber();
        const cloudActors = cActors.records[0].get('count').toNumber();
        const cloudRels = cRels.records[0].get('count').toNumber();

        console.log('\n✅ Migration complete!');
        console.log(`   Cloud: ${cloudMovies} movies + ${cloudActors} actors = ${cloudMovies + cloudActors} nodes`);
        console.log(`   Cloud: ${cloudRels} relationships`);
        console.log(`   Local: ${movies.length} movies + ${actors.length} actors = ${localTotal} nodes`);
        console.log(`   Local: ${relationships.length} relationships`);

        if (cloudMovies === movies.length && cloudActors === actors.length && cloudRels === relationships.length) {
            console.log('\n🎉 All counts match — migration verified!');
        } else {
            console.log('\n⚠️  Count mismatch detected — review above numbers');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await localSession.close();
        await cloudSession.close();
        await localDriver.close();
        await cloudDriver.close();
    }
}

if (require.main === module) {
    migrateData();
}

module.exports = { migrateData };
