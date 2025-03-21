// populateDatabase.js
require('dotenv').config();
const neo4j = require('neo4j-driver');
const fetch = require('node-fetch');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'your_password'
  )
);

/**
 * Fetches popular movies from TMDB.
 * @param {number} page - The page number to fetch.
 * @returns {Promise<Array>} An array of movie objects.
 */
async function fetchPopularMovies(page = 1) {
  const url = `${TMDB_API_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&vote_count.gte=1000&page=${page}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
}


/**
 * Fetches detailed movie info (including cast) from TMDB.
 * @param {number|string} movieId - The movie ID.
 * @returns {Promise<Object>} Movie details including credits.
 */
async function fetchMovieDetails(movieId) {
  const url = `${TMDB_API_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

/**
 * Inserts a movie node into Neo4j.
 * @param {Object} session - The active Neo4j session.
 * @param {Object} movie - The movie object.
 */
async function insertMovie(session, movie) {
  const query = `
    MERGE (m:Movie {id: $id})
    SET m.title = $title,
        m.poster_path = $poster_path,
        m.release_date = $release_date,
        m.vote_count = $vote_count
    RETURN m
  `;
  const params = {
    id: movie.id.toString(),
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_count: movie.vote_count  // assuming TMDB API returns vote_count
  };
  await session.run(query, params);
}


/**
 * Inserts an actor node and creates an ACTED_IN relationship to the movie.
 * @param {Object} session - The active Neo4j session.
 * @param {Object} movie - The movie object.
 * @param {Object} actor - The actor object.
 */
async function insertActorAndRelationship(session, movie, actor) {
  const query = `
    MERGE (a:Actor {id: $actorId})
    SET a.name = $name,
        a.profile_path = $profile_path
    WITH a
    MATCH (m:Movie {id: $movieId})
    MERGE (a)-[:ACTED_IN]->(m)
  `;
  const params = {
    actorId: actor.id.toString(),
    name: actor.name,
    profile_path: actor.profile_path,
    movieId: movie.id.toString()
  };
  await session.run(query, params);
}

/**
 * Main function to fetch movies from TMDB and populate Neo4j.
 */
async function populateDatabase() {
  const session = neo4jDriver.session();
  try {
    // Define how many pages to fetch (adjust as needed)
    const totalPages = 50;
    for (let page = 1; page <= totalPages; page++) {
      console.log(`Fetching page ${page} of popular movies...`);
      const movies = await fetchPopularMovies(page);
      for (const movie of movies) {
        console.log(`Processing movie: ${movie.title} (ID: ${movie.id})`);
        // Fetch movie details (including cast)
        const movieDetails = await fetchMovieDetails(movie.id);
        // Insert the movie node
        await insertMovie(session, movie);
        // If cast info is available, insert actors and create relationships
        if (movieDetails.credits && movieDetails.credits.cast) {
          // Optionally limit the number of actors (e.g., top 10)
          const castList = movieDetails.credits.cast;
          for (const actor of castList) {
            console.log(` - Inserting actor: ${actor.name}`);
            await insertActorAndRelationship(session, movie, actor);
          }
        }
      }
    }
    console.log("Database population complete.");
  } catch (error) {
    console.error("Error populating database:", error);
  } finally {
    await session.close();
    await neo4jDriver.close();
  }
}

populateDatabase();

