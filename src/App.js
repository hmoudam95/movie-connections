import React, { useState, useEffect, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameReducer, initialGameState } from './state/gameReducer';
import { uiReducer, initialUIState } from './state/uiReducer';
import { useMobile } from './hooks/useMobile';
import { useMovieAPI } from './hooks/useMovieAPI';
import { useHintSystem } from './hooks/useHintSystem';
import './App.css';

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w300';


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


function App() {
  const [game, gameDispatch] = useReducer(gameReducer, initialGameState);
  const [ui, uiDispatch] = useReducer(uiReducer, initialUIState);

  const isMobile = useMobile();
  const { fetchMovieDetails, fetchActorFilmography, getRandomMovie } = useMovieAPI(gameDispatch, uiDispatch);

  // Destructure for convenience
  const {
    phase: gameState, startMovie, targetMovie, currentMovie,
    selectedActor, chain: gameChain, cast, filmography,
    targetMovieCast, showTargetCast, hintChain, cachedHintChain,
  } = game;
  const {
    loading: isLoading, randomLoading, actorLoading,
    hintLoading, targetCastLoading, error, randomError,
  } = ui;

  const { fetchHint, cancelHintFetch } = useHintSystem(
    gameState, currentMovie, targetMovie, cachedHintChain, gameDispatch, uiDispatch
  );

  // Auto-randomize on mount
  useEffect(() => {
    if (!startMovie) getRandomMovie(true);
    if (!targetMovie) getRandomMovie(false);
  }, [getRandomMovie, startMovie, targetMovie]);


  const handleActorSelect = async (actor) => {
    gameDispatch({ type: 'SELECT_ACTOR', actor });
    await fetchActorFilmography(actor.id);
  };

  const handleFilmographySelect = async (movieSummary) => {
    if (gameChain.some(item => item.movie.id === movieSummary.id)) {
      uiDispatch({ type: 'SET_ERROR', message: 'This movie is already in your chain!' });
      return;
    }

    uiDispatch({ type: 'SET_LOADING', value: true });
    try {
      const details = await fetchMovieDetails(movieSummary.id);
      gameDispatch({ type: 'SELECT_MOVIE', movie: movieSummary, details, actor: selectedActor });

      if (details.id === targetMovie.id) {
        setTimeout(() => gameDispatch({ type: 'COMPLETE_GAME' }), 300);
      }
    } catch (err) {
      console.error(err);
      uiDispatch({ type: 'SET_ERROR', message: 'Failed to load movie details' });
    } finally {
      uiDispatch({ type: 'SET_LOADING', value: false });
    }
  };


  // Start & reset with smooth transitions
  const startGame = () => {
    if (startMovie && targetMovie) {
      setTimeout(() => gameDispatch({ type: 'START_GAME' }), 100);
    } else {
      uiDispatch({ type: 'SET_ERROR', message: 'Please select both a starting and target movie' });
    }
  };

  const resetGame = () => {
    cancelHintFetch();
    setTimeout(() => {
      gameDispatch({ type: 'RESET' });
      uiDispatch({ type: 'RESET_UI' });
    }, 100);
  };


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
            onClick={() => getRandomMovie(true)}
            disabled={randomLoading.start}
          >
            🎲 Get Random Movie
          </button>
          
          {randomLoading.start && <MovieCardSkeleton />}
          {randomError.start && (
            <ErrorState
              title="Failed to Load Movie"
              description={randomError.start}
              onRetry={() => getRandomMovie(true)}
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
            onClick={() => getRandomMovie(false)}
            disabled={randomLoading.target}
          >
            🎲 Get Random Movie
          </button>
          
          {randomLoading.target && <MovieCardSkeleton />}
          {randomError.target && (
            <ErrorState
              title="Failed to Load Movie"
              description={randomError.target}
              onRetry={() => getRandomMovie(false)}
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
            
            <div className="vs-divider">
              <span className="vs-icon">→</span>
              <div className="steps-counter">
                <span className="steps-number">{gameChain.length - 1}</span>
                <span className="steps-label">steps</span>
              </div>
            </div>
            
            <div className="target-section">
              <h4>Target:</h4>
              <div 
                className="compact-movie-card"
                onClick={() => gameDispatch({ type: 'TOGGLE_TARGET_CAST' })}
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
          className={`hint-button ${hintLoading ? 'button-loading' : ''} ${cachedHintChain ? 'hint-ready' : ''}`}
          disabled={hintLoading}
        >
          {cachedHintChain ? '⚡ Show Shortest Path (Ready)' : '💡 Show Shortest Path'}
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
          <button className="button-ghost" onClick={() => gameDispatch({ type: 'DESELECT_ACTOR' })}>← Back to Cast</button>
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
              uiDispatch({ type: 'SET_ERROR', message: 'Victory message copied to clipboard! 🎉' });
              setTimeout(() => uiDispatch({ type: 'CLEAR_ERROR' }), 3000);
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
          <button onClick={() => uiDispatch({ type: 'CLEAR_ERROR' })}>✕</button>
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
                onClick={() => gameDispatch({ type: 'HIDE_TARGET_CAST' })}
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
            onClick={() => gameDispatch({ type: 'HIDE_TARGET_CAST' })}
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
