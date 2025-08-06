import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const API_BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w300';

// If REACT_APP_API_BASE_URL isn’t set (in dev), we'll hit the CRA proxy
// const API_BASE = process.env.REACT_APP_API_BASE_URL || '';


// Skeleton Components
const MovieCardSkeleton = () => (
  <div className="movie-card-skeleton">
    <div className="skeleton skeleton-poster"></div>
    <div className="skeleton skeleton-title"></div>
    <div className="skeleton skeleton-year"></div>
  </div>
);

const ActorCardSkeleton = () => (
  <div className="actor-card-skeleton">
    <div className="skeleton skeleton-profile"></div>
    <div className="skeleton skeleton-name"></div>
    <div className="skeleton skeleton-character"></div>
  </div>
);

// Actor Image Component with fallback
const ActorImage = ({ actor, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };
  
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };
  
  if (!actor.profile_path || imageError) {
    return (
      <div className={`actor-placeholder ${className}`}>
        <span className="actor-initials">{getInitials(actor.name)}</span>
      </div>
    );
  }
  
  return (
    <>
      {imageLoading && <div className={`actor-loading ${className}`}></div>}
      <img
        className={`${className} ${imageLoading ? 'loading' : ''}`}
        src={POSTER_BASE_URL + actor.profile_path}
        alt={actor.name}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </>
  );
};

const ErrorState = ({ title, description, onRetry, retryText = "Try Again" }) => (
  <div className="error-state fade-in">
    <div className="error-icon">⚠️</div>
    <div className="error-title">{title}</div>
    <div className="error-description">{description}</div>
    {onRetry && (
      <button className="retry-button" onClick={onRetry}>
        {retryText}
      </button>
    )}
  </div>
);

// Helper function to calculate dynamic font size based on title length
const getDynamicFontSize = (title) => {
  const length = title.length;
  if (length <= 12) return '1.25rem';
  if (length <= 20) return '1.125rem';
  if (length <= 30) return '1rem';
  if (length <= 40) return '0.9rem';
  return '0.825rem';
};


const EmptyState = ({ icon, title, description }) => (
  <div className="empty-state fade-in">
    <div className="empty-state-icon">{icon}</div>
    <div className="empty-state-text">{title}</div>
    <div className="empty-state-description">{description}</div>
  </div>
);

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Loading state for different components
  const [randomLoading, setRandomLoading] = useState({ start: false, target: false });
  const [actorLoading, setActorLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  // Error states for specific components
  const [randomError, setRandomError] = useState({ start: null, target: null });
  const [actorError, setActorError] = useState(null);
  const [hintError, setHintError] = useState(null);

  // ** State for hint display **
  const [hintChain, setHintChain] = useState(null);

  // ** Background hint fetching states **
  const [backgroundHintFetching, setBackgroundHintFetching] = useState(false);
  const [backgroundHintReady, setBackgroundHintReady] = useState(false);
  const [backgroundFetchController, setBackgroundFetchController] = useState(null);
  const [cachedHintChain, setCachedHintChain] = useState(null); // Store background result separately

  // ** State for target movie cast preview **
  const [showTargetCast, setShowTargetCast] = useState(false);
  const [targetMovieCast, setTargetMovieCast] = useState([]);
  const [targetCastLoading, setTargetCastLoading] = useState(false);

  // ** Mobile-specific state **
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Fetch target movie cast for preview
  const fetchTargetMovieCast = async (movieId) => {
    setTargetCastLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
      );
      const data = await res.json();
      // Get top 8 actors, sorted by order (main cast first)
      const topCast = data.credits.cast
        .slice()
        .sort((a, b) => a.order - b.order)
        .slice(0, 8);
      setTargetMovieCast(topCast);
    } catch (err) {
      console.error('Failed to fetch target movie cast:', err);
      setTargetMovieCast([]);
    } finally {
      setTargetCastLoading(false);
    }
  };

  // Fetch actor filmography
  const fetchActorFilmography = async (actorId) => {
    setActorLoading(true);
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
      setActorLoading(false);
    }
  };

  // Get a random blockbuster movie
  const getRandomMovie = useCallback(
    async (setMovie, isStart) => {
      const randomType = isStart ? 'start' : 'target';
      
      // Set specific loading state
      setRandomLoading(prev => ({ ...prev, [randomType]: true }));
      setRandomError(prev => ({ ...prev, [randomType]: null }));
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const page = Math.floor(Math.random() * 5) + 1;
        const res = await fetch(
          `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=1000&primary_release_date.lte=${today}&page=${page}`
        );
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const { results } = await res.json();
        const candidates = results.filter(m => m.poster_path);
        
        if (candidates.length === 0) {
          throw new Error('No movies found with posters');
        }
        
        const choice = candidates[Math.floor(Math.random() * candidates.length)];
        
        if (isStart) {
          const details = await fetchMovieDetails(choice.id);
          setStartMovie(choice);
          setCurrentMovie(details);
          setCast(details.credits.cast.slice().sort((a, b) => a.order - b.order));
          setGameChain([{ movie: choice, actor: null }]);
        } else {
          setTargetMovie(choice);
          // Fetch cast details for target movie preview
          await fetchTargetMovieCast(choice.id);
        }
        
        setRandomError(prev => ({ ...prev, [randomType]: null }));
      } catch (err) {
        console.error('Random movie error:', err);
        setRandomError(prev => ({ ...prev, [randomType]: err.message }));
      } finally {
        setRandomLoading(prev => ({ ...prev, [randomType]: false }));
      }
    },
    []
  );

  // Auto‑randomize on mount
  useEffect(() => {
    if (!startMovie) getRandomMovie(setStartMovie, true);
    if (!targetMovie) getRandomMovie(setTargetMovie, false);
  }, [getRandomMovie, startMovie, targetMovie]);

  // Handle manual selection (now only for random movies)
  const handleMovieSelect = async (movie, isStart) => {
    const details = await fetchMovieDetails(movie.id);
    if (isStart) {
      setStartMovie(movie);
      setCurrentMovie(details);
      setCast(details.credits.cast.slice().sort((a, b) => a.order - b.order));
      setGameChain([{ movie, actor: null }]);
    } else {
      setTargetMovie(movie);
      // Fetch cast details for target movie preview
      await fetchTargetMovieCast(movie.id);
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
    // Cancel any ongoing background fetch
    if (backgroundFetchController) {
      backgroundFetchController.abort();
      setBackgroundFetchController(null);
    }
    
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
      setRandomError({ start: null, target: null });
      setActorError(null);
      setHintError(null);
      setShowTargetCast(false);
      setTargetMovieCast([]);
      setTargetCastLoading(false);
      
      // Reset background hint states
      setBackgroundHintFetching(false);
      setBackgroundHintReady(false);
      setBackgroundFetchController(null);
      setCachedHintChain(null);
    }, 100);
  };

  // ** Background hint fetching (silent, non-blocking) **
  const fetchHintInBackground = useCallback(async () => {
    if (!currentMovie?.id || !targetMovie?.id) return;
    if (backgroundHintReady || backgroundHintFetching) return; // Avoid duplicate fetches

    // Create AbortController for cancellation
    const controller = new AbortController();
    setBackgroundFetchController(controller);
    setBackgroundHintFetching(true);
    
    try {
      const res = await fetch(
        `http://localhost:4000/api/path?fromMovieId=${currentMovie.id}&toMovieId=${targetMovie.id}`,
        { signal: controller.signal }
      );
      
      if (controller.signal.aborted) return;
      
      const data = await res.json();
      if (!data.error && data.chain) {
        setCachedHintChain(data.chain); // Store in cache, don't display yet
        setBackgroundHintReady(true);
      }
      // Silent error handling - don't show errors to user for background fetches
    } catch (err) {
      if (!controller.signal.aborted) {
        console.log('Background hint fetch failed (silent):', err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setBackgroundHintFetching(false);
        setBackgroundFetchController(null);
      }
    }
  }, [currentMovie?.id, targetMovie?.id, backgroundHintReady, backgroundHintFetching]);

  // ** Fetch hint on button click (now uses cached results when available) **
  const fetchHint = async () => {
    if (!currentMovie?.id || !targetMovie?.id) return;
    
    // If background fetch completed, show cached results instantly
    if (backgroundHintReady && cachedHintChain) {
      setHintChain(cachedHintChain); // Display the cached result
      return;
    }
    
    // If background fetch is in progress, wait for it
    if (backgroundHintFetching) {
      setHintLoading(true);
      
      // Set up a listener for background fetch completion
      const checkBackgroundComplete = setInterval(() => {
        if (backgroundHintReady && cachedHintChain) {
          setHintChain(cachedHintChain); // Display cached result
          setHintLoading(false);
          clearInterval(checkBackgroundComplete);
        } else if (!backgroundHintFetching) {
          // Background fetch failed, start traditional fetch
          clearInterval(checkBackgroundComplete);
          traditionalFetch();
        }
      }, 100);
      
      // Timeout fallback (10 seconds)
      setTimeout(() => {
        if (hintLoading) {
          clearInterval(checkBackgroundComplete);
          traditionalFetch();
        }
      }, 10000);
      
      return;
    }
    
    // Start traditional fetch immediately
    traditionalFetch();
  };

  // Helper function for traditional hint fetching
  const traditionalFetch = async () => {
    setHintLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/path?fromMovieId=${currentMovie.id}&toMovieId=${targetMovie.id}`
      );
      const data = await res.json();
      if (data.error) setError(data.error);
      else setHintChain(data.chain);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch hint');
    } finally {
      setHintLoading(false);
    }
  };

  // ** Background hint fetching when game starts **
  useEffect(() => {
    if (gameState === 'playing' && currentMovie?.id && targetMovie?.id) {
      // Smart delay: Give user time to look at the interface before fetching
      const timer = setTimeout(() => {
        fetchHintInBackground();
      }, 2000); // 2 second delay for optimal UX

      return () => clearTimeout(timer);
    }
  }, [gameState, currentMovie?.id, targetMovie?.id, fetchHintInBackground]);

  // ** Cleanup on component unmount **
  useEffect(() => {
    return () => {
      if (backgroundFetchController) {
        backgroundFetchController.abort();
      }
    };
  }, [backgroundFetchController]);

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
          <button 
            className={`button-secondary ${randomLoading.start ? 'button-loading' : ''}`} 
            onClick={() => getRandomMovie(setStartMovie, true)}
            disabled={randomLoading.start}
          >
            🎲 Get Random Movie
          </button>
          
          {randomLoading.start && <MovieCardSkeleton />}
          {randomError.start && (
            <ErrorState
              title="Failed to Load Movie"
              description={randomError.start}
              onRetry={() => getRandomMovie(setStartMovie, true)}
              retryText="Try Another Movie"
            />
          )}
          {!randomLoading.start && !randomError.start && startMovie && (
            <div className="selected-movie fade-in">
              <img
                src={
                  startMovie.poster_path
                    ? POSTER_BASE_URL + startMovie.poster_path
                    : '/api/placeholder/200/300'
                }
                alt={startMovie.title}
              />
              <h3 style={{ fontSize: getDynamicFontSize(startMovie.title) }}>
                {startMovie.title}
              </h3>
              <p>({startMovie.release_date?.slice(0, 4) || 'N/A'})</p>
            </div>
          )}
        </div>

        {/* Target Movie */}
        <div className="movie-selector">
          <h2>Target Movie</h2>
          <button 
            className={`button-secondary ${randomLoading.target ? 'button-loading' : ''}`} 
            onClick={() => getRandomMovie(setTargetMovie, false)}
            disabled={randomLoading.target}
          >
            🎲 Get Random Movie
          </button>
          
          {randomLoading.target && <MovieCardSkeleton />}
          {randomError.target && (
            <ErrorState
              title="Failed to Load Movie"
              description={randomError.target}
              onRetry={() => getRandomMovie(setTargetMovie, false)}
              retryText="Try Another Movie"
            />
          )}
          {!randomLoading.target && !randomError.target && targetMovie && (
            <div className="selected-movie fade-in">
              <img
                src={
                  targetMovie.poster_path
                    ? POSTER_BASE_URL + targetMovie.poster_path
                    : '/api/placeholder/200/300'
                }
                alt={targetMovie.title}
              />
              <h3 style={{ fontSize: getDynamicFontSize(targetMovie.title) }}>
                {targetMovie.title}
              </h3>
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
      {/* Compact movie header - Target and Current side by side */}
      <div className="movies-header animate-in">
        <div className="header-content">
          <div className="movie-pair">
            <div className="target-section">
              <h4>Target:</h4>
              <div 
                className="compact-movie-card"
                onClick={() => setShowTargetCast(!showTargetCast)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={
                    targetMovie.poster_path
                      ? POSTER_BASE_URL + targetMovie.poster_path
                      : '/api/placeholder/80/120'
                  }
                  alt={targetMovie.title}
                />
                <div className="movie-title">{targetMovie.title}</div>
              </div>
            </div>
            
            <div className="vs-divider">
              <span className="vs-icon">→</span>
              <div className="steps-counter">
                <span className="steps-number">{gameChain.length - 1}</span>
                <span className="steps-label">steps</span>
              </div>
            </div>
            
            <div className="current-section">
              <h4>Current:</h4>
              <div className="compact-movie-card">
                <img
                  src={
                    currentMovie.poster_path
                      ? POSTER_BASE_URL + currentMovie.poster_path
                      : '/api/placeholder/80/120'
                  }
                  alt={currentMovie.title}
                />
                <div className="movie-title">{currentMovie.title}</div>
              </div>
            </div>
          </div>
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
                    <ActorImage actor={item.actor} />
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

      {/* Initial shortest path removed for better performance - use hint button instead */}

      {/* Hint button & display */}
      <div className="hint-section animate-in animate-in-delay-3">
        <button 
          onClick={fetchHint} 
          className={`hint-button ${hintLoading ? 'button-loading' : ''} ${backgroundHintReady && cachedHintChain ? 'hint-ready' : ''}`}
          disabled={hintLoading}
        >
          {backgroundHintReady && cachedHintChain ? '⚡ Show Shortest Path (Ready)' : '💡 Show Shortest Path'}
        </button>
        {hintLoading && (
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">Finding optimal path...</div>
          </div>
        )}
        {!hintLoading && hintChain && (
          <div className="hint fade-in">
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
          {actorLoading ? (
            <div className="skeleton-grid">
              {[...Array(8)].map((_, i) => (
                <ActorCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="filmography-list stagger-grid">
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
          )}
        </div>
      ) : (
        <div className="cast-section animate-in animate-in-delay-4">
          <h2>Select an Actor</h2>
          <div className="cast-list stagger-grid">
            {cast.map(a => (
              <div
                key={a.id}
                className="cast-item"
                onClick={() => handleActorSelect(a)}
              >
                <ActorImage actor={a} />
                <p>{a.name}</p>
                <p className="character">as {a.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Swipe gesture handlers
  const handleSwipeLeft = () => {
    if (gameState === 'setup') {
      startGame();
    } else if (gameState === 'playing') {
      // Could show hint or target cast
      if (!hintChain) fetchHint();
    }
  };

  const handleSwipeRight = () => {
    if (gameState === 'playing') {
      resetGame();
    } else if (gameState === 'complete') {
      resetGame();
    }
  };

  const handleSwipeUp = () => {
    if (gameState === 'playing' && !showTargetCast) {
      setShowTargetCast(true);
    }
  };

  // Removed mobile bottom navigation - keeping interface clean and minimalistic

  // Removed mobile FAB - keeping interface clean and minimalistic

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
                      <ActorImage actor={item.actor} />
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
    <motion.div 
      className="app"
      drag={isMobile ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(event, info) => {
        if (Math.abs(info.offset.x) > 100) {
          if (info.offset.x > 0) {
            handleSwipeRight();
          } else {
            handleSwipeLeft();
          }
        }
      }}
    >
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {/* Mobile components removed for cleaner minimalistic design */}
      
      {/* Mobile-First Target Cast Overlay */}
      <AnimatePresence>
        {showTargetCast && (
          <motion.div
            className="cast-overlay"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="cast-overlay-header">
              <h4 className="cast-overlay-title">Cast Preview</h4>
              <button 
                className="cast-overlay-close"
                onClick={() => setShowTargetCast(false)}
              >
                ✕
              </button>
            </div>
            {targetCastLoading ? (
              <div className="cast-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="cast-item-skeleton">
                    <div className="cast-avatar-skeleton" />
                    <div className="cast-name-skeleton" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="cast-grid">
                {targetMovieCast.slice(0, 12).map(actor => (
                  <div key={actor.id} className="cast-item">
                    <div className="cast-avatar">
                      {actor.profile_path ? (
                        <img
                          src={POSTER_BASE_URL + actor.profile_path}
                          alt={actor.name}
                        />
                      ) : (
                        <div className="cast-placeholder">
                          {actor.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p className="cast-name">
                      {actor.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Backdrop */}
      <AnimatePresence>
        {showTargetCast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 999
            }}
            onClick={() => setShowTargetCast(false)}
          />
        )}
      </AnimatePresence>
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
    </motion.div>
  );
}

export default App;
