import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import ErrorState from '../components/ErrorState';
import { getDynamicFontSize, POSTER_BASE_URL } from '../utils/constants';
import { DIFFICULTY_MOVES } from '../state/gameReducer';

const springSnappy = { type: 'spring', stiffness: 400, damping: 25 };

export default function SetupScreen({
  startMovie, targetMovie, randomLoading, randomError,
  getRandomMovie, startGame, difficulty, gameDispatch,
}) {
  const [spinningStart, setSpinningStart] = useState(false);
  const [spinningTarget, setSpinningTarget] = useState(false);

  const handleRandom = (isStart) => {
    if (isStart) {
      setSpinningStart(true);
      setTimeout(() => setSpinningStart(false), 600);
    } else {
      setSpinningTarget(true);
      setTimeout(() => setSpinningTarget(false), 600);
    }
    getRandomMovie(isStart);
  };

  return (
    <div className="setup-screen">
      <h1>🎬 Movie Connections</h1>
      <p>Connect movies through actors in the fewest steps possible!</p>

      {/* Difficulty selector */}
      <div className="difficulty-selector">
        {Object.entries(DIFFICULTY_MOVES).map(([key, moves]) => (
          <motion.button
            key={key}
            className={`difficulty-btn ${difficulty === key ? 'difficulty-active' : ''}`}
            onClick={() => gameDispatch({ type: 'SET_DIFFICULTY', difficulty: key })}
            whileTap={{ scale: 0.95 }}
            animate={difficulty === key ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={springSnappy}
          >
            <span className="difficulty-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            <span className="difficulty-moves">{moves} moves</span>
          </motion.button>
        ))}
      </div>

      <div className="movie-selectors">
        {/* Starting Movie */}
        <div className="movie-selector">
          <h2>Starting Movie</h2>
          <motion.button
            className={`random-movie-btn ${randomLoading.start ? 'button-loading' : ''}`}
            onClick={() => handleRandom(true)}
            disabled={randomLoading.start}
            whileTap={{ scale: 0.97 }}
          >
            <motion.span
              className="dice-emoji"
              animate={spinningStart ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              🎲
            </motion.span>
            Get Random Movie
          </motion.button>

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
            <motion.div
              className="selected-movie"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {startMovie.poster_path ? (
                <img src={POSTER_BASE_URL + startMovie.poster_path} alt={startMovie.title} />
              ) : (
                <div className="movie-placeholder large">🎬</div>
              )}
              <div className="selected-movie-info">
                <h3 style={{ fontSize: getDynamicFontSize(startMovie.title) }}>
                  {startMovie.title}
                </h3>
                <p>{startMovie.release_date?.slice(0, 4) || 'N/A'}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* VS Divider */}
        <div className="vs-divider-setup">
          <div className="vs-line" />
          <span className="vs-text">VS</span>
          <div className="vs-line" />
        </div>

        {/* Target Movie */}
        <div className="movie-selector">
          <h2>Target Movie</h2>
          <motion.button
            className={`random-movie-btn ${randomLoading.target ? 'button-loading' : ''}`}
            onClick={() => handleRandom(false)}
            disabled={randomLoading.target}
            whileTap={{ scale: 0.97 }}
          >
            <motion.span
              className="dice-emoji"
              animate={spinningTarget ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              🎲
            </motion.span>
            Get Random Movie
          </motion.button>

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
            <motion.div
              className="selected-movie"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {targetMovie.poster_path ? (
                <img src={POSTER_BASE_URL + targetMovie.poster_path} alt={targetMovie.title} />
              ) : (
                <div className="movie-placeholder large">🎬</div>
              )}
              <div className="selected-movie-info">
                <h3 style={{ fontSize: getDynamicFontSize(targetMovie.title) }}>
                  {targetMovie.title}
                </h3>
                <p>{targetMovie.release_date?.slice(0, 4) || 'N/A'}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <motion.button
        className="start-button button-large"
        onClick={startGame}
        disabled={!startMovie || !targetMovie}
        whileTap={{ scale: 0.97 }}
      >
        Start Game
      </motion.button>
    </div>
  );
}
