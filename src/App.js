import React, { useEffect, useReducer } from 'react';
import { motion } from 'framer-motion';
import { gameReducer, initialGameState } from './state/gameReducer';
import { uiReducer, initialUIState } from './state/uiReducer';
import { useMobile } from './hooks/useMobile';
import { useMovieAPI } from './hooks/useMovieAPI';
import { useHintSystem } from './hooks/useHintSystem';
import SetupScreen from './screens/SetupScreen';
import GameBoard from './screens/GameBoard';
import VictoryScreen from './screens/VictoryScreen';
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
    else if (gameState === 'playing' && !hintChain) fetchHint();
  };

  const handleSwipeRight = () => {
    if (gameState === 'playing' || gameState === 'complete') resetGame();
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
        <>
          {gameState === 'setup' && (
            <SetupScreen
              startMovie={startMovie}
              targetMovie={targetMovie}
              randomLoading={randomLoading}
              randomError={randomError}
              getRandomMovie={getRandomMovie}
              startGame={startGame}
            />
          )}
          {gameState === 'playing' && (
            <GameBoard
              currentMovie={currentMovie}
              targetMovie={targetMovie}
              gameChain={gameChain}
              selectedActor={selectedActor}
              cast={cast}
              filmography={filmography}
              hintChain={hintChain}
              cachedHintChain={cachedHintChain}
              actorLoading={actorLoading}
              hintLoading={hintLoading}
              gameDispatch={gameDispatch}
              handleActorSelect={handleActorSelect}
              handleFilmographySelect={handleFilmographySelect}
              fetchHint={fetchHint}
            />
          )}
          {gameState === 'complete' && (
            <VictoryScreen
              gameChain={gameChain}
              resetGame={resetGame}
              uiDispatch={uiDispatch}
            />
          )}
        </>
      )}
    </motion.div>
  );
}

export default App;
