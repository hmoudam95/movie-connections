import React, { useEffect, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameReducer, initialGameState } from './state/gameReducer';
import { uiReducer, initialUIState } from './state/uiReducer';
import { useMobile } from './hooks/useMobile';
import { useMovieAPI } from './hooks/useMovieAPI';
import { useHintSystem } from './hooks/useHintSystem';
import SetupScreen from './screens/SetupScreen';
import GameBoard from './screens/GameBoard';
import VictoryScreen from './screens/VictoryScreen';
import GameOverScreen from './screens/GameOverScreen';
import CastOverlay from './components/CastOverlay';
import './App.css';

function App() {
  const [game, gameDispatch] = useReducer(gameReducer, initialGameState);
  const [ui, uiDispatch] = useReducer(uiReducer, initialUIState);

  const isMobile = useMobile();
  const { fetchMovieDetails, fetchActorFilmography, getRandomMovie } = useMovieAPI(gameDispatch, uiDispatch);

  const {
    phase: gameState, startMovie, targetMovie, currentMovie,
    selectedActor, chain: gameChain, cast, filmography,
    targetMovieCast, showTargetCast, cachedHintChain,
    movesRemaining, movesUsed, hintLevel, hintsUsed, difficulty,
  } = game;
  const {
    loading: isLoading, randomLoading, actorLoading,
    hintLoading, targetCastLoading, error, randomError,
  } = ui;

  const { fetchHintInBackground, cancelHintFetch } = useHintSystem(
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

    // Check if this would use the last move (and it's not the target)
    uiDispatch({ type: 'SET_LOADING', value: true });
    try {
      const details = await fetchMovieDetails(movieSummary.id);
      gameDispatch({ type: 'SELECT_MOVIE', movie: movieSummary, details, actor: selectedActor });

      if (details.id === targetMovie.id) {
        setTimeout(() => gameDispatch({ type: 'COMPLETE_GAME' }), 300);
      } else if (movesRemaining - 1 <= 0) {
        // Used last move and didn't reach target
        setTimeout(() => gameDispatch({ type: 'FAIL_GAME' }), 300);
      }
    } catch (err) {
      console.error(err);
      uiDispatch({ type: 'SET_ERROR', message: 'Failed to load movie details' });
    } finally {
      uiDispatch({ type: 'SET_LOADING', value: false });
    }
  };

  // Graduated hint handler
  const handleHint = (level) => {
    if (!cachedHintChain) {
      // Hint not ready yet — trigger background fetch
      fetchHintInBackground();
      uiDispatch({ type: 'SET_ERROR', message: 'Hint is loading... try again in a moment.' });
      return;
    }

    const optimalSteps = Math.floor((cachedHintChain.length - 1) / 2); // movies only

    if (level === 1) {
      // Free hint: show path length
      gameDispatch({
        type: 'USE_HINT',
        level: 1,
        content: `The shortest path is ${optimalSteps} step${optimalSteps !== 1 ? 's' : ''}`,
        moveCost: 0,
      });
    } else if (level === 2) {
      // Costs 1 move: show first actor in optimal path
      if (movesRemaining < 1) {
        uiDispatch({ type: 'SET_ERROR', message: 'Not enough moves for this hint!' });
        return;
      }
      const firstActor = cachedHintChain.find(n => n.type === 'Actor');
      gameDispatch({
        type: 'USE_HINT',
        level: 2,
        content: firstActor ? `Try looking for ${firstActor.title}` : 'No actor hint available',
        moveCost: 1,
      });
    } else if (level === 3) {
      // Costs 2 moves: show next movie in optimal path
      if (movesRemaining < 2) {
        uiDispatch({ type: 'SET_ERROR', message: 'Not enough moves for this hint!' });
        return;
      }
      // Find the second movie in the optimal path (first is the start movie)
      const movies = cachedHintChain.filter(n => n.type === 'Movie');
      const nextMovie = movies.length > 1 ? movies[1] : null;
      gameDispatch({
        type: 'USE_HINT',
        level: 3,
        content: nextMovie ? `The path goes through "${nextMovie.title}"` : 'No movie hint available',
        moveCost: 2,
      });
    }
  };

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

  // Swipe gesture handlers
  const handleSwipeLeft = () => {
    if (gameState === 'setup') startGame();
  };

  const handleSwipeRight = () => {
    if (gameState === 'playing' || gameState === 'complete' || gameState === 'failed') resetGame();
  };

  return (
    <motion.div
      className="app"
      drag={isMobile ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(event, info) => {
        if (Math.abs(info.offset.x) > 100) {
          if (info.offset.x > 0) handleSwipeRight();
          else handleSwipeLeft();
        }
      }}
    >
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => uiDispatch({ type: 'CLEAR_ERROR' })}>✕</button>
        </div>
      )}

      <CastOverlay
        showTargetCast={showTargetCast}
        targetMovieCast={targetMovieCast}
        targetCastLoading={targetCastLoading}
        gameDispatch={gameDispatch}
      />

      {isLoading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading your movie connection...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {gameState === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <SetupScreen
                startMovie={startMovie}
                targetMovie={targetMovie}
                randomLoading={randomLoading}
                randomError={randomError}
                getRandomMovie={getRandomMovie}
                startGame={startGame}
                difficulty={difficulty}
                gameDispatch={gameDispatch}
              />
            </motion.div>
          )}
          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <GameBoard
                currentMovie={currentMovie}
                targetMovie={targetMovie}
                gameChain={gameChain}
                selectedActor={selectedActor}
                cast={cast}
                filmography={filmography}
                cachedHintChain={cachedHintChain}
                hintLevel={hintLevel}
                hintsUsed={hintsUsed}
                movesRemaining={movesRemaining}
                movesUsed={movesUsed}
                difficulty={difficulty}
                actorLoading={actorLoading}
                hintLoading={hintLoading}
                gameDispatch={gameDispatch}
                handleActorSelect={handleActorSelect}
                handleFilmographySelect={handleFilmographySelect}
                handleHint={handleHint}
              />
            </motion.div>
          )}
          {gameState === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              <VictoryScreen
                gameChain={gameChain}
                movesUsed={movesUsed}
                difficulty={difficulty}
                hintsUsed={hintsUsed}
                resetGame={resetGame}
                uiDispatch={uiDispatch}
              />
            </motion.div>
          )}
          {gameState === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            >
              <GameOverScreen
                gameChain={gameChain}
                cachedHintChain={cachedHintChain}
                movesUsed={movesUsed}
                difficulty={difficulty}
                resetGame={resetGame}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

export default App;
