import React from 'react';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import ErrorState from '../components/ErrorState';
import { getDynamicFontSize, POSTER_BASE_URL } from '../utils/constants';
import { DIFFICULTY_MOVES } from '../state/gameReducer';

export default function SetupScreen({
  startMovie, targetMovie, randomLoading, randomError,
  getRandomMovie, startGame, difficulty, gameDispatch,
}) {
  return (
    <div className="setup-screen page-transition">
      <h1>🎬 Movie Connections</h1>
      <p>Connect movies through actors in the fewest steps possible!</p>

      {/* Difficulty selector */}
      <div className="difficulty-selector">
        {Object.entries(DIFFICULTY_MOVES).map(([key, moves]) => (
          <button
            key={key}
            className={`difficulty-btn ${difficulty === key ? 'difficulty-active' : ''}`}
            onClick={() => gameDispatch({ type: 'SET_DIFFICULTY', difficulty: key })}
          >
            <span className="difficulty-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            <span className="difficulty-moves">{moves} moves</span>
          </button>
        ))}
      </div>

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
              {startMovie.poster_path ? (
                <img src={POSTER_BASE_URL + startMovie.poster_path} alt={startMovie.title} />
              ) : (
                <div className="movie-placeholder large">🎬</div>
              )}
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
              {targetMovie.poster_path ? (
                <img src={POSTER_BASE_URL + targetMovie.poster_path} alt={targetMovie.title} />
              ) : (
                <div className="movie-placeholder large">🎬</div>
              )}
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
}
