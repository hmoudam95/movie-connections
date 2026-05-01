require('dotenv').config();
const neo4j = require('neo4j-driver');

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = process.env.VERCEL === '1';

// Neo4j connection configuration
const getNeo4jConfig = () => {
    if (isVercel) {
        // Production: Use cloud Neo4j (Neo4j AuraDB)
        return {
            uri: process.env.NEO4J_URI,
            user: process.env.NEO4J_USER,
            password: process.env.NEO4J_PASSWORD
        };
    } else {
        // Development: Use local Neo4j
        return {
            uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
            user: process.env.NEO4J_USER || 'neo4j',
            password: process.env.NEO4J_PASSWORD || 'your_password'
        };
    }
};

const config = getNeo4jConfig();

const driver = neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.user, config.password)
);

// Helper: upsert Movie & its cast
async function ensureMovie(session, movieIdStr) {
    try {
        if (!process.env.TMDB_API_KEY) {
            const e = new Error('TMDB_API_KEY env var not configured on the server');
            e.code = 'TMDB_KEY_MISSING';
            throw e;
        }

        // 1) Fetch from TMDB
        const resp = await fetch(
            `https://api.themoviedb.org/3/movie/${movieIdStr}` +
            `?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`
        );
        if (!resp.ok) {
            const body = await resp.text().catch(() => '');
            const e = new Error(`TMDB fetch failed: ${resp.status} ${resp.statusText} ${body.slice(0, 200)}`);
            e.code = 'TMDB_FETCH_FAILED';
            e.status = resp.status;
            throw e;
        }
        const { id, title, poster_path, release_date, credits } = await resp.json();

        // 2) MERGE the Movie node & set its props
        await session.run(
            `
    MERGE (m:Movie {id:$id})
      SET m.title        = $title,
          m.poster_path  = $poster_path,
          m.release_date = $release_date
    `,
            {
                id: movieIdStr,
                title,
                poster_path,
                release_date,
            }
        );

        // 3) For each actor credit:
        for (const a of credits.cast || []) {
            const aidStr = a.id.toString();

            // a) MERGE the Actor node & set its props
            // b) MATCH the existing Movie by id
            // c) MERGE the relationship between them
            await session.run(
                `
      MERGE (actor:Actor {id:$aid})
        SET actor.name         = $aname,
            actor.profile_path = $profile
      WITH actor
      MATCH (m:Movie {id:$mid})
      MERGE (actor)-[:ACTED_IN]->(m)
      `,
                {
                    aid: aidStr,
                    aname: a.name,
                    profile: a.profile_path,
                    mid: movieIdStr,
                }
            );
        }
    } catch (error) {
        // Always log errors so they're visible in Vercel function logs.
        // Only verbose info-level logs are gated on DEBUG.
        console.error('[ensureMovie]', movieIdStr, error.code || '', error.message);
        throw error;
    }
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fromMovieId, toMovieId } = req.query;
    if (!fromMovieId || !toMovieId) {
        return res.status(400).json({ error: 'fromMovieId & toMovieId required.' });
    }
    if (!/^\d{1,8}$/.test(fromMovieId) || !/^\d{1,8}$/.test(toMovieId)) {
        return res.status(400).json({ error: 'Invalid movie ID format.' });
    }

    if (process.env.DEBUG) {
        console.log(`Environment: ${isVercel ? 'Production' : 'Development'}`);
    }

    // Phase 1: upsert both endpoints in a WRITE session
    const writeSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
        if (process.env.DEBUG) console.log(`Upserting ${fromMovieId} & ${toMovieId}`);
        await ensureMovie(writeSession, fromMovieId);
        await ensureMovie(writeSession, toMovieId);
    } catch (err) {
        console.error('[upsert]', err.code || '', err.message);
        return res.status(500).json({
            error: 'Failed to load movie data',
            phase: 'upsert',
            code: err.code || 'UNKNOWN',
            detail: err.message,
        });
    } finally {
        await writeSession.close();
    }

    // Phase 2: shortestPath in a READ session
    const readSession = driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
        if (process.env.DEBUG) console.log(`shortestPath(${fromMovieId} -> ${toMovieId})`);
        const result = await readSession.run(
            `
    MATCH (start:Movie {id:$from}), (end:Movie {id:$to})
    MATCH p = shortestPath((start)-[:ACTED_IN*1..8]-(end))
    RETURN [n IN nodes(p) | {
      id:    n.id,
      title: coalesce(n.title, n.name),
      type:  labels(n)[0]
    }] AS chain
    `,
            { from: fromMovieId, to: toMovieId }
        );

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'No connection found.' });
        }

        const chain = result.records[0].get('chain');
        if (process.env.DEBUG) console.log('Path:', chain.map(n => n.title).join(' -> '));
        res.json({ chain });
    } catch (err) {
        console.error('[shortestPath]', err.code || '', err.message);
        res.status(500).json({
            error: 'Failed to compute shortest path',
            phase: 'shortestPath',
            code: err.code || 'UNKNOWN',
            detail: err.message,
        });
    } finally {
        await readSession.close();
    }
}
