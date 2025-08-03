import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const API_BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w300';

// If REACT_APP_API_BASE_URL isn’t set (in dev), we'll hit the CRA proxy
// const API_BASE = process.env.REACT_APP_API_BASE_URL || '';


function App() {
  // Movie & game state
  const [startMovie, setStartMovie] = useState('');
  const [targetMovie, setTargetMovie] = useState('');
  const [currentMovie, setCurrentMovie] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);
  const [gameChain, setGameChain] = useState([]);
  const [gameState, setGameState] = useState('setup'); // setup, playing, complete

  // UI state
  const [cast, setCast] = useState([]);
  const [filmography, setFilmography] = useState([]);
  const [searchStartResults, setSearchStartResults] = useState([]);
  const [searchTargetResults, setSearchTargetResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ** State for hint display **
  const [hintChain, setHintChain] = useState(null);

  // Search for movies
  const searchMovies = async (query, setResults) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
      );
      const data = await res.json();
      setResults(data.results.slice(0, 5));
    } catch (err) {
      setError('Failed to search movies');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch movie details + credits
  const fetchMovieDetails = async (movieId) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
      );
      return await res.json();
    } catch (err) {
      setError('Failed to fetch movie details');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch actor filmography
  const fetchActorFilmography = async (actorId) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`
      );
      const data = await res.json();
      setFilmography(
        data.cast
          .slice()
          .sort((a, b) => {
            const ay = a.release_date ? +a.release_date.slice(0, 4) : 0;
            const by = b.release_date ? +b.release_date.slice(0, 4) : 0;
            return by - ay;
          })
      );
    } catch (err) {
      setError("Failed to fetch actor's filmography");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get a random blockbuster movie
  const getRandomMovie = useCallback(
    async (setMovie, isStart) => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const page = Math.floor(Math.random() * 5) + 1;
        const res = await fetch(
          `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=1000&primary_release_date.lte=${today}&page=${page}`
        );
        const { results } = await res.json();
        const candidates = results.filter(m => m.poster_path);
        const choice = candidates[Math.floor(Math.random() * candidates.length)];
        const details = await fetchMovieDetails(choice.id);

        if (isStart) {
          setStartMovie(choice);
          setCurrentMovie(details);
          setCast(details.credits.cast.slice().sort((a, b) => a.order - b.order));
          setGameChain([{ movie: choice, actor: null }]);
        } else {
          setTargetMovie(choice);
        }
      } catch (err) {
        setError('Failed to get random movie');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Auto‑randomize on mount
  useEffect(() => {
    if (!startMovie) getRandomMovie(setStartMovie, true);
    if (!targetMovie) getRandomMovie(setTargetMovie, false);
  }, [getRandomMovie, startMovie, targetMovie]);

  // Handle manual selection
  const handleMovieSelect = async (movie, isStart) => {
    const details = await fetchMovieDetails(movie.id);
    if (isStart) {
      setStartMovie(movie);
      setCurrentMovie(details);
      setCast(details.credits.cast.slice().sort((a, b) => a.order - b.order));
      setGameChain([{ movie, actor: null }]);
      setSearchStartResults([]);
    } else {
      setTargetMovie(movie);
      setSearchTargetResults([]);
    }
  };

  const handleActorSelect = async (actor) => {
    setSelectedActor(actor);
    await fetchActorFilmography(actor.id);
  };

  const handleFilmographySelect = async (movieSummary) => {
    // movieSummary is just the flat object from the actor’s credit list,
    // so we need to pull in its credits before we can use it.
    if (gameChain.some(item => item.movie.id === movieSummary.id)) {
      setError('This movie is already in your chain!');
      return;
    }

    setIsLoading(true);
    try {
      const details = await fetchMovieDetails(movieSummary.id);

      // add the full-details movie + actor into the chain
      setGameChain(chain => [
        ...chain,
        { movie: details, actor: selectedActor }
      ]);
      setCurrentMovie(details);

      // now safe to read details.credits.cast
      setCast(
        details.credits.cast
          .slice()
          .sort((a, b) => a.order - b.order)
      );

      setSelectedActor(null);
      setFilmography([]);

      if (details.id === targetMovie.id) {
        // Add delay for smooth transition to victory screen
        setTimeout(() => setGameState('complete'), 300);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load movie details');
    } finally {
      setIsLoading(false);
    }
  };


  // Start & reset with smooth transitions
  const startGame = () => {
    if (startMovie && targetMovie) {
      // Add a small delay for smooth transition
      setTimeout(() => setGameState('playing'), 100);
    } else {
      setError('Please select both a starting and target movie');
    }
  };
  const resetGame = () => {
    // Add a small delay for smooth transition
    setTimeout(() => {
      setStartMovie('');
      setTargetMovie('');
      setCurrentMovie(null);
      setSelectedActor(null);
      setGameChain([]);
      setCast([]);
      setFilmography([]);
      setGameState('setup');
      setError(null);
      setHintChain(null);
    }, 100);
  };

  // ** Fetch hint on button click **
  const fetchHint = async () => {
    if (!currentMovie?.id || !targetMovie?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/path?fromMovieId=${currentMovie.id}&toMovieId=${targetMovie.id}`
      );
      const data = await res.json();
      if (data.error) setError(data.error);
      else setHintChain(data.chain);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch hint');
    } finally {
      setIsLoading(false);
    }
  };

  // ** Removed auto-fetch for better performance **
  // Initial shortest path is now only fetched when user clicks "Give me a hint"


  // Setup screen JSX
  const renderSetupScreen = () => (
    <div className="setup-screen page-transition">
      <h1>🎬 Movie Connections</h1>
      <p>Connect movies through actors in the fewest steps possible!</p>
      <div className="movie-selectors stagger-children">
        {/* Starting Movie */}
        <div className="movie-selector">
          <h2>Starting Movie</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for a movie..."
              value={startMovie.title || ''}
              onChange={e => {
                setStartMovie('');
                searchMovies(e.target.value, setSearchStartResults);
              }}
            />
            <button className="button-secondary" onClick={() => getRandomMovie(setStartMovie, true)}>
              Random
            </button>
          </div>
          {searchStartResults.length > 0 && (
            <ul className="search-results">
              {searchStartResults.map(m => (
                <li key={m.id} onClick={() => handleMovieSelect(m, true)}>
                  {m.title} ({m.release_date?.slice(0, 4) || 'N/A'})
                </li>
              ))}
            </ul>
          )}
          {startMovie && (
            <div className="selected-movie">
              <img
                src={
                  startMovie.poster_path
                    ? POSTER_BASE_URL + startMovie.poster_path
                    : '/api/placeholder/200/300'
                }
                alt={startMovie.title}
              />
              <h3>{startMovie.title}</h3>
              <p>({startMovie.release_date?.slice(0, 4) || 'N/A'})</p>
            </div>
          )}
        </div>

        {/* Target Movie */}
        <div className="movie-selector">
          <h2>Target Movie</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for a movie..."
              value={targetMovie.title || ''}
              onChange={e => {
                setTargetMovie('');
                searchMovies(e.target.value, setSearchTargetResults);
              }}
            />
            <button className="button-secondary" onClick={() => getRandomMovie(setTargetMovie, false)}>
              Random
            </button>
          </div>
          {searchTargetResults.length > 0 && (
            <ul className="search-results">
              {searchTargetResults.map(m => (
                <li key={m.id} onClick={() => handleMovieSelect(m, false)}>
                  {m.title} ({m.release_date?.slice(0, 4) || 'N/A'})
                </li>
              ))}
            </ul>
          )}
          {targetMovie && (
            <div className="selected-movie">
              <img
                src={
                  targetMovie.poster_path
                    ? POSTER_BASE_URL + targetMovie.poster_path
                    : '/api/placeholder/200/300'
                }
                alt={targetMovie.title}
              />
              <h3>{targetMovie.title}</h3>
              <p>({targetMovie.release_date?.slice(0, 4) || 'N/A'})</p>
            </div>
          )}
        </div>
      </div>
      <button
        className="start-button button-large"
        onClick={startGame}
        disabled={!startMovie || !targetMovie}
      >
        Start Game
      </button>
    </div>
  );

  // Game board JSX
  const renderGameBoard = () => (
    <div className="game-board page-transition">
      {/* Target info & steps */}
      <div className="game-info animate-in">
        <div className="target-info">
          <h3>Target Movie:</h3>
          <div className="target-movie">
            <img
              src={
                targetMovie.poster_path
                  ? POSTER_BASE_URL + targetMovie.poster_path
                  : '/api/placeholder/100/150'
              }
              alt={targetMovie.title}
            />
            <p>{targetMovie.title}</p>
          </div>
        </div>
        <div className="steps-info">
          <h3>Steps: {gameChain.length - 1}</h3>
        </div>
      </div>

      {/* Movie–actor chain visualization */}
      <div className="game-chain animate-in animate-in-delay-1">
        <h2>Your Movie Chain</h2>
        <div className="chain-items">
          {gameChain.map((item, idx) => (
            <div key={idx} className="chain-item">
              <div className="chain-movie">
                <img
                  src={
                    item.movie.poster_path
                      ? POSTER_BASE_URL + item.movie.poster_path
                      : '/api/placeholder/100/150'
                  }
                  alt={item.movie.title}
                />
                <p>{item.movie.title}</p>
              </div>
              {item.actor && (
                <>
                  <span className="chain-via">via</span>
                  <div className="chain-actor">
                    <p>{item.actor.name}</p>
                    <img
                      src={
                        item.actor.profile_path
                          ? POSTER_BASE_URL + item.actor.profile_path
                          : '/api/placeholder/100/150'
                      }
                      alt={item.actor.name}
                    />
                  </div>
                </>
              )}
              {idx < gameChain.length - 1 && (
                <div className="chain-arrow">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current movie */}
      <div className="current-movie animate-in animate-in-delay-2">
        <h2>Current Movie</h2>
        <div className="movie-details">
          <img
            src={
              currentMovie.poster_path
                ? POSTER_BASE_URL + currentMovie.poster_path
                : '/api/placeholder/200/300'
            }
            alt={currentMovie.title}
          />
          <div className="movie-info">
            <h3>{currentMovie.title}</h3>
            <p>({currentMovie.release_date?.slice(0, 4) || 'N/A'})</p>
          </div>
        </div>
      </div>

      {/* Initial shortest path removed for better performance - use hint button instead */}

      {/* Hint button & display */}
      <div className="hint-section animate-in animate-in-delay-3">
        <button onClick={fetchHint} className="hint-button">
          💡 Show Shortest Path
        </button>
        {hintChain && (
          <div className="hint">
            <strong>Shortest path:</strong>{' '}
            {hintChain.map((node, i) => (
              <span key={node.id}>
                {node.title}
                {i < hintChain.length - 1 ? ' → ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cast or filmography */}
      {selectedActor ? (
        <div className="filmography-section animate-in animate-in-delay-4">
          <h2>Movies with {selectedActor.name}</h2>
          <button className="button-ghost" onClick={() => setSelectedActor(null)}>← Back to Cast</button>
          <div className="filmography-list">
            {filmography.map(m => (
              <div
                key={m.id}
                className="filmography-item"
                onClick={() => handleFilmographySelect(m)}
              >
                <img
                  src={
                    m.poster_path
                      ? POSTER_BASE_URL + m.poster_path
                      : '/api/placeholder/100/150'
                  }
                  alt={m.title}
                />
                <div className="movie-info">
                  <h3>{m.title}</h3>
                  <p>({m.release_date?.slice(0, 4) || 'N/A'})</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="cast-section animate-in animate-in-delay-4">
          <h2>Select an Actor</h2>
          <div className="cast-list">
            {cast.map(a => (
              <div
                key={a.id}
                className="cast-item"
                onClick={() => handleActorSelect(a)}
              >
                <img
                  src={
                    a.profile_path
                      ? POSTER_BASE_URL + a.profile_path
                      : '/api/placeholder/100/150'
                  }
                  alt={a.name}
                />
                <p>{a.name}</p>
                <p className="character">as {a.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Calculate achievement based on steps taken
  const getAchievement = () => {
    const steps = gameChain.length - 1;
    if (steps === 1) return { emoji: '🏆', text: 'LEGENDARY! Perfect Connection!' };
    if (steps === 2) return { emoji: '🥇', text: 'AMAZING! Near Perfect!' };
    if (steps <= 4) return { emoji: '🥈', text: 'EXCELLENT! Great Job!' };
    if (steps <= 6) return { emoji: '🥉', text: 'GOOD! Well Done!' };
    return { emoji: '🎯', text: 'COMPLETED! Nice Work!' };
  };

  // Result screen JSX
  const renderResultScreen = () => {
    const achievement = getAchievement();
    const steps = gameChain.length - 1;
    
    return (
      <div className="result-screen page-transition">
        {/* Victory Header */}
        <div className="victory-header">
          <h1>🎉 Victory!</h1>
          <div className="achievement-badge">
            <span>{achievement.emoji}</span>
            <span>{achievement.text}</span>
          </div>
        </div>

        {/* Victory Stats */}
        <div className="victory-stats">
          <h2>Mission Accomplished!</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{steps}</span>
              <span className="stat-label">Steps Taken</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{gameChain.length}</span>
              <span className="stat-label">Total Movies</span>
            </div>
          </div>
        </div>

        {/* Final Chain Display */}
        <div className="final-chain">
          <h3>🎬 Your Winning Path</h3>
          <div className="chain-items">
            {gameChain.map((item, idx) => (
              <div key={idx} className="chain-item">
                <div className="chain-movie">
                  <img
                    src={
                      item.movie.poster_path
                        ? POSTER_BASE_URL + item.movie.poster_path
                        : '/api/placeholder/100/150'
                    }
                    alt={item.movie.title}
                  />
                  <p>{item.movie.title}</p>
                </div>
                {item.actor && (
                  <>
                    <span className="chain-via">via</span>
                    <div className="chain-actor">
                      <img
                        src={
                          item.actor.profile_path
                            ? POSTER_BASE_URL + item.actor.profile_path
                            : '/api/placeholder/100/150'
                        }
                        alt={item.actor.name}
                      />
                      <p>{item.actor.name}</p>
                    </div>
                  </>
                )}
                {idx < gameChain.length - 1 && (
                  <div className="chain-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="victory-actions">
          <button className="play-again-button" onClick={resetGame}>
            🎮 Play Again
          </button>
          <button className="share-button button-secondary" onClick={() => {
            const text = `🎬 I just connected ${gameChain[0].movie.title} to ${gameChain[gameChain.length-1].movie.title} in ${steps} steps! Can you beat that? #MovieConnections`;
            if (navigator.share) {
              navigator.share({ text });
            } else {
              navigator.clipboard.writeText(text);
              setError('Victory message copied to clipboard! 🎉');
              setTimeout(() => setError(null), 3000);
            }
          }}>
            📤 Share Victory
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {isLoading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading your movie connection...</p>
        </div>
      ) : (
        <>
          {gameState === 'setup' && renderSetupScreen()}
          {gameState === 'playing' && renderGameBoard()}
          {gameState === 'complete' && renderResultScreen()}
        </>
      )}
    </div>
  );
}

export default App;
