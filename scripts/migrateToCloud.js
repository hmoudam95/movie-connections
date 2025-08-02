// migrateToCloud.js
require('dotenv').config();
const neo4j = require('neo4j-driver');

// Local Neo4j connection (source)
const localDriver = neo4j.driver(
    process.env.LOCAL_NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
        process.env.LOCAL_NEO4J_USER || 'neo4j',
        process.env.LOCAL_NEO4J_PASSWORD || 'your_password'
    )
);

// Cloud Neo4j connection (destination)
const cloudDriver = neo4j.driver(
    process.env.CLOUD_NEO4J_URI,
    neo4j.auth.basic(
        process.env.CLOUD_NEO4J_USER,
        process.env.CLOUD_NEO4J_PASSWORD
    )
);

async function migrateData() {
    const localSession = localDriver.session();
    const cloudSession = cloudDriver.session();

    try {
        console.log('🚀 Starting migration from local to cloud Neo4j...');

        // 1. Export all movies from local database
        console.log('📤 Exporting movies from local database...');
        const moviesResult = await localSession.run(
            'MATCH (m:Movie) RETURN m.id as id, m.title as title, m.poster_path as poster_path, m.release_date as release_date'
        );

        const movies = moviesResult.records.map(record => ({
            id: record.get('id'),
            title: record.get('title'),
            poster_path: record.get('poster_path'),
            release_date: record.get('release_date')
        }));

        console.log(`📊 Found ${movies.length} movies in local database`);

        // 2. Export all actors from local database
        console.log('📤 Exporting actors from local database...');
        const actorsResult = await localSession.run(
            'MATCH (a:Actor) RETURN a.id as id, a.name as name, a.profile_path as profile_path'
        );

        const actors = actorsResult.records.map(record => ({
            id: record.get('id'),
            name: record.get('name'),
            profile_path: record.get('profile_path')
        }));

        console.log(`📊 Found ${actors.length} actors in local database`);

        // 3. Export all relationships from local database
        console.log('📤 Exporting relationships from local database...');
        const relationshipsResult = await localSession.run(
            'MATCH (a:Actor)-[r:ACTED_IN]->(m:Movie) RETURN a.id as actorId, m.id as movieId'
        );

        const relationships = relationshipsResult.records.map(record => ({
            actorId: record.get('actorId'),
            movieId: record.get('movieId')
        }));

        console.log(`📊 Found ${relationships.length} relationships in local database`);

        // 4. Import movies to cloud database
        console.log('📥 Importing movies to cloud database...');
        for (const movie of movies) {
            await cloudSession.run(
                `
        MERGE (m:Movie {id: $id})
        SET m.title = $title,
            m.poster_path = $poster_path,
            m.release_date = $release_date
        `,
                movie
            );
        }
        console.log(`✅ Imported ${movies.length} movies to cloud database`);

        // 5. Import actors to cloud database
        console.log('📥 Importing actors to cloud database...');
        for (const actor of actors) {
            await cloudSession.run(
                `
        MERGE (a:Actor {id: $id})
        SET a.name = $name,
            a.profile_path = $profile_path
        `,
                actor
            );
        }
        console.log(`✅ Imported ${actors.length} actors to cloud database`);

        // 6. Import relationships to cloud database
        console.log('📥 Importing relationships to cloud database...');
        for (const rel of relationships) {
            await cloudSession.run(
                `
        MATCH (a:Actor {id: $actorId})
        MATCH (m:Movie {id: $movieId})
        MERGE (a)-[:ACTED_IN]->(m)
        `,
                rel
            );
        }
        console.log(`✅ Imported ${relationships.length} relationships to cloud database`);

        // 7. Verify migration
        console.log('🔍 Verifying migration...');
        const cloudMoviesCount = await cloudSession.run('MATCH (m:Movie) RETURN count(m) as count');
        const cloudActorsCount = await cloudSession.run('MATCH (a:Actor) RETURN count(a) as count');
        const cloudRelationshipsCount = await cloudSession.run('MATCH ()-[r:ACTED_IN]->() RETURN count(r) as count');

        console.log(`📊 Cloud database now contains:`);
        console.log(`   - ${cloudMoviesCount.records[0].get('count').toNumber()} movies`);
        console.log(`   - ${cloudActorsCount.records[0].get('count').toNumber()} actors`);
        console.log(`   - ${cloudRelationshipsCount.records[0].get('count').toNumber()} relationships`);

        console.log('🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await localSession.close();
        await cloudSession.close();
        await localDriver.close();
        await cloudDriver.close();
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateData();
}

module.exports = { migrateData }; 