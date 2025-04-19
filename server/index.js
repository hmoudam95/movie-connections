require('dotenv').config();
const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// ─── Helper: upsert Movie & its cast ─────────────────────────────────────────
async function ensureMovie(session, movieIdStr) {
    // 1) Fetch from TMDB
    const resp = await fetch(
        `https://api.themoviedb.org/3/movie/${movieIdStr}` +
        `?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`
    );
    if (!resp.ok) throw new Error(`TMDB fetch failed: ${resp.status}`);
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
}

// ─── API: shortest‐path endpoint ─────────────────────────────────────────────
app.get('/api/path', async (req, res) => {
    const { fromMovieId, toMovieId } = req.query;
    if (!fromMovieId || !toMovieId) {
        return res.status(400).json({ error: 'fromMovieId & toMovieId required.' });
    }

    // Phase 1: upsert both endpoints in a WRITE session
    const writeSession = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
        console.log(`⬆️  Upserting ${fromMovieId} & ${toMovieId}`);
        await ensureMovie(writeSession, fromMovieId);
        await ensureMovie(writeSession, toMovieId);
    } catch (err) {
        console.error('Error upserting:', err);
        return res.status(500).json({ error: err.message });
    } finally {
        await writeSession.close();
    }

    // Phase 2: shortestPath in a READ session
    const readSession = driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
        console.log(`🔍  shortestPath(${fromMovieId} → ${toMovieId})`);
        const result = await readSession.run(
            `
      MATCH (start:Movie {id:$from}), (end:Movie {id:$to})
      MATCH p = shortestPath((start)-[:ACTED_IN*]-(end))
      RETURN [n IN nodes(p) | {
        id:    n.id,
        title: coalesce(n.title, n.name),
        type:  labels(n)[0]
      }] AS chain
      `,
            { from: fromMovieId, to: toMovieId }
        );

        if (result.records.length === 0) {
            console.log('⚠️  No path found');
            return res.status(404).json({ error: 'No connection found.' });
        }

        const chain = result.records[0].get('chain');
        console.log('✅  Path:', chain.map(n => n.title).join(' → '));
        res.json({ chain });
    } catch (err) {
        console.error('Error finding path:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await readSession.close();
    }
});

app.listen(process.env.PORT, () =>
    console.log(`API listening on http://localhost:${process.env.PORT}`)
);
