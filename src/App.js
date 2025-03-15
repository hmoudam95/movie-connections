import React, { useState, useEffect } from 'react';
import './App.css';

// Replace with your actual TMDB API key
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const API_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w300";

function App() {
  const [startMovie, setStartMovie] = useState("");
  const [targetMovie, setTargetMovie] = useState("");
  const [currentMovie, setCurrentMovie] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);
  const [gameChain, setGameChain] = useState([]);
  const [gameState, setGameState] = useState("setup"); // setup, playing, complete
  const [cast, setCast] = useState([]);
  const [filmography, setFilmography] = useState([]);
  const [searchStartResults, setSearchStartResults] = useState([]);
  const [searchTargetResults, setSearchTargetResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!startMovie) {
      getRandomMovie(setStartMovie, true);
    }
    if (!targetMovie) {
      getRandomMovie(setTargetMovie, false);
    }
  }, []);


  // Search for movies based on title
  const searchMovies = async (query, setResults) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
      );
      const data = await response.json();
      setResults(data.results.slice(0, 5));
    } catch (err) {
      setError("Failed to search movies");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch movie details including cast
  const fetchMovieDetails = async (movieId) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
      );
      const data = await response.json();
      return data;
    } catch (err) {
      setError("Failed to fetch movie details");
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch actor's filmography
  const fetchActorFilmography = async (actorId) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`
      );
      const data = await response.json();
      setFilmography(
        data.cast.sort((a, b) => {
          const aYear = a.release_date ? new Date(a.release_date).getFullYear() : 0;
          const bYear = b.release_date ? new Date(b.release_date).getFullYear() : 0;
          return bYear - aYear;
        })
      );

    } catch (err) {
      setError("Failed to fetch actor's filmography");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle movie selection from search results
  const handleMovieSelect = async (movie, isStart) => {
    const movieDetails = await fetchMovieDetails(movie.id);

    if (isStart) {
      setStartMovie(movie);
      setSearchStartResults([]);
      setCurrentMovie(movieDetails);

      // Initialize game chain with the starting movie
      setGameChain([{
        movie: movie,
        actor: null
      }]);

      // Set cast from the movie details
      // Sort by the 'order' property (lower order means higher billing)
      setCast(movieDetails.credits.cast.sort((a, b) => a.order - b.order));

    } else {
      setTargetMovie(movie);
      setSearchTargetResults([]);
    }
  };

  // Handle actor selection
  const handleActorSelect = async (actor) => {
    setSelectedActor(actor);
    await fetchActorFilmography(actor.id);
  };

  // Handle movie selection from filmography
  const handleFilmographySelect = async (movie) => {
    // Don't allow selecting a movie that's already in the chain
    if (gameChain.some(item => item.movie.id === movie.id)) {
      setError("This movie is already in your chain!");
      return;
    }

    const movieDetails = await fetchMovieDetails(movie.id);

    // Add the selected movie to the game chain
    setGameChain([...gameChain, {
      movie: movie,
      actor: selectedActor
    }]);

    // Update current movie and cast
    setCurrentMovie(movieDetails);
    setCast(movieDetails.credits.cast.slice(0, 10));

    // Clear selected actor and filmography
    setSelectedActor(null);
    setFilmography([]);

    // Check if we've reached the target movie
    if (movie.id === targetMovie.id) {
      setGameState("complete");
    }
  };

  // Start the game
  const startGame = () => {
    if (startMovie && targetMovie) {
      setGameState("playing");
    } else {
      setError("Please select both a starting and target movie");
    }
  };

  // Reset the game
  const resetGame = () => {
    setStartMovie("");
    setTargetMovie("");
    setCurrentMovie(null);
    setSelectedActor(null);
    setGameChain([]);
    setCast([]);
    setFilmography([]);
    setGameState("setup");
    setError(null);
  };

  // Random movie generator
  const getRandomMovie = async (setMovie, isStart) => {
    setIsLoading(true);
    try {
      // Get today's date (or set a fixed upper bound if you prefer)
      const today = new Date().toISOString().split("T")[0];
      // Optionally, use a fixed date like:
      // const maxReleaseDate = "2024-12-31";

      // Choose a random page (adjust max page as needed)
      const page = Math.floor(Math.random() * 5) + 1;

      // Use the /discover/movie endpoint with filters for popular movies.
      const response = await fetch(
        `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=1000&primary_release_date.lte=${today}&page=${page}`
      );
      const data = await response.json();

      // Filter out movies without a poster image
      const filteredMovies = data.results.filter(movie => movie.poster_path);
      if (filteredMovies.length === 0) {
        throw new Error("No suitable movie found");
      }
      const randomIndex = Math.floor(Math.random() * filteredMovies.length);
      const randomMovie = filteredMovies[randomIndex];

      if (isStart) {
        const movieDetails = await fetchMovieDetails(randomMovie.id);
        setStartMovie(randomMovie);
        setCurrentMovie(movieDetails);
        setCast(movieDetails.credits.cast.sort((a, b) => a.order - b.order));
        setGameChain([{ movie: randomMovie, actor: null }]);
      } else {
        setTargetMovie(randomMovie);
      }
    } catch (err) {
      setError("Failed to get random movie");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  // Render the setup screen
  const renderSetupScreen = () => (
    <div className="setup-screen">
      <h1>Movie Connections</h1>
      <p>Connect movies through actors in the fewest steps possible!</p>

      <div className="movie-selectors">
        <div className="movie-selector">
          <h2>Starting Movie</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for a movie..."
              value={startMovie ? startMovie.title : ""}
              onChange={(e) => {
                setStartMovie("");
                searchMovies(e.target.value, setSearchStartResults);
              }}
            />
            <button onClick={() => getRandomMovie(setStartMovie, true)}>Random</button>
          </div>

          {searchStartResults.length > 0 && (
            <ul className="search-results">
              {searchStartResults.map(movie => (
                <li key={movie.id} onClick={() => handleMovieSelect(movie, true)}>
                  {movie.title} ({movie.release_date ? movie.release_date.substring(0, 4) : "N/A"})
                </li>
              ))}
            </ul>
          )}

          {startMovie && (
            <div className="selected-movie">
              <img
                src={startMovie.poster_path ? `${POSTER_BASE_URL}${startMovie.poster_path}` : "/api/placeholder/200/300"}
                alt={startMovie.title}
              />
              <h3>{startMovie.title}</h3>
              <p>({startMovie.release_date ? startMovie.release_date.substring(0, 4) : "N/A"})</p>
            </div>
          )}
        </div>

        <div className="movie-selector">
          <h2>Target Movie</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for a movie..."
              value={targetMovie ? targetMovie.title : ""}
              onChange={(e) => {
                setTargetMovie("");
                searchMovies(e.target.value, setSearchTargetResults);
              }}
            />
            <button onClick={() => getRandomMovie(setTargetMovie, false)}>Random</button>
          </div>

          {searchTargetResults.length > 0 && (
            <ul className="search-results">
              {searchTargetResults.map(movie => (
                <li key={movie.id} onClick={() => handleMovieSelect(movie, false)}>
                  {movie.title} ({movie.release_date ? movie.release_date.substring(0, 4) : "N/A"})
                </li>
              ))}
            </ul>
          )}

          {targetMovie && (
            <div className="selected-movie">
              <img
                src={targetMovie.poster_path ? `${POSTER_BASE_URL}${targetMovie.poster_path}` : "/api/placeholder/200/300"}
                alt={targetMovie.title}
              />
              <h3>{targetMovie.title}</h3>
              <p>({targetMovie.release_date ? targetMovie.release_date.substring(0, 4) : "N/A"})</p>
            </div>
          )}
        </div>
      </div>

      <button
        className="start-button"
        onClick={startGame}
        disabled={!startMovie || !targetMovie}
      >
        Start Game
      </button>
    </div>
  );

  // Render the game board
  const renderGameBoard = () => (
    <div className="game-board">
      <div className="game-info">
        <div className="target-info">
          <h3>Target Movie:</h3>
          <div className="target-movie">
            <img
              src={targetMovie.poster_path ? `${POSTER_BASE_URL}${targetMovie.poster_path}` : "/api/placeholder/100/150"}
              alt={targetMovie.title}
            />
            <p>{targetMovie.title}</p>
          </div>
        </div>

        <div className="steps-info">
          <h3>Steps: {gameChain.length - 1}</h3>
        </div>
      </div>

      <div className="game-chain">
        <h2>Your Movie Chain</h2>
        <div className="chain-items">
          {gameChain.map((item, index) => (
            <div key={index} className="chain-item">
              <div className="chain-movie">
                <img
                  src={item.movie.poster_path ? `${POSTER_BASE_URL}${item.movie.poster_path}` : "/api/placeholder/100/150"}
                  alt={item.movie.title}
                />
                <p>{item.movie.title}</p>
              </div>
              {item.actor && (
                <div className="chain-actor">
                  <span>via</span>
                  <p>{item.actor.name}</p>
                  <img
                    src={item.actor.profile_path ? `${POSTER_BASE_URL}${item.actor.profile_path}` : "/api/placeholder/100/150"}
                    alt={item.actor.name}
                  />
                </div>
              )}
              {index < gameChain.length - 1 && <div className="chain-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="current-movie">
        <h2>Current Movie</h2>
        <div className="movie-details">
          <img
            src={currentMovie.poster_path ? `${POSTER_BASE_URL}${currentMovie.poster_path}` : "/api/placeholder/200/300"}
            alt={currentMovie.title}
          />
          <div className="movie-info">
            <h3>{currentMovie.title}</h3>
            <p>({currentMovie.release_date ? currentMovie.release_date.substring(0, 4) : "N/A"})</p>
          </div>
        </div>
      </div>

      {selectedActor ? (
        <div className="filmography-section">
          <h2>Movies with {selectedActor.name}</h2>
          <button onClick={() => setSelectedActor(null)}>Back to Cast</button>
          <div className="filmography-list">
            {filmography.map(movie => (
              <div
                key={movie.id}
                className="filmography-item"
                onClick={() => handleFilmographySelect(movie)}
              >
                <img
                  src={movie.poster_path ? `${POSTER_BASE_URL}${movie.poster_path}` : "/api/placeholder/100/150"}
                  alt={movie.title}
                />
                <div className="movie-info">
                  <h3>{movie.title}</h3>
                  <p>({movie.release_date ? movie.release_date.substring(0, 4) : "N/A"})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="cast-section">
          <h2>Select an Actor</h2>
          <div className="cast-list">
            {cast.map(actor => (
              <div
                key={actor.id}
                className="cast-item"
                onClick={() => handleActorSelect(actor)}
              >
                <img
                  src={actor.profile_path ? `${POSTER_BASE_URL}${actor.profile_path}` : "/api/placeholder/100/150"}
                  alt={actor.name}
                />
                <p>{actor.name}</p>
                <p className="character">as {actor.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render the result screen
  const renderResultScreen = () => (
    <div className="result-screen">
      <h1>You've reached the target movie!</h1>
      <h2>Steps taken: {gameChain.length - 1}</h2>

      <div className="final-chain">
        {gameChain.map((item, index) => (
          <div key={index} className="chain-item">
            <div className="chain-movie">
              <img
                src={item.movie.poster_path ? `${POSTER_BASE_URL}${item.movie.poster_path}` : "/api/placeholder/100/150"}
                alt={item.movie.title}
              />
              <h3>{item.movie.title}</h3>
              <p>({item.movie.release_date ? item.movie.release_date.substring(0, 4) : "N/A"})</p>
            </div>
            {item.actor && (<div className="chain-actor">
              <span>via</span>
              <h3>{item.actor.name}</h3>
              <img
                src={item.actor.profile_path ? `${POSTER_BASE_URL}${item.actor.profile_path}` : "/api/placeholder/100/150"}
                alt={item.actor.name}
              />
            </div>
            )}
            {index < gameChain.length - 1 && <div className="chain-arrow">→</div>}
          </div>
        ))}
      </div>

      <button className="play-again-button" onClick={resetGame}>
        Play Again
      </button>
    </div>
  );

  // Render loading state
  const renderLoading = () => (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );

  // Main render function
  return (
    <div className="app">
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {isLoading ? (
        renderLoading()
      ) : (
        <>
          {gameState === "setup" && renderSetupScreen()}
          {gameState === "playing" && renderGameBoard()}
          {gameState === "complete" && renderResultScreen()}
        </>
      )}
    </div>
  );
}

export default App;