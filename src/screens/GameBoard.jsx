import React, { useState, useMemo } from 'react';
import ActorImage from '../components/ActorImage';
import ActorCardSkeleton from '../components/ActorCardSkeleton';
import ChainDisplay from '../components/ChainDisplay';
import { POSTER_BASE_URL } from '../utils/constants';
import { DIFFICULTY_MOVES } from '../state/gameReducer';

export default function GameBoard({
  currentMovie, targetMovie, gameChain, selectedActor,
  cast, filmography, cachedHintChain,
  hintLevel, hintsUsed, movesRemaining, movesUsed, difficulty,
  actorLoading, hintLoading,
  gameDispatch, handleActorSelect, handleFilmographySelect, handleHint,
}) {
  const [showAllCast, setShowAllCast] = useState(false);
  const [filmographySearch, setFilmographySearch] = useState('');

  const creditedCast = useMemo(
    () => cast.filter(a => !a.character?.toLowerCase().includes('uncredited')),
    [cast]
  );
  const visibleCast = showAllCast ? creditedCast : creditedCast.slice(0, 15);
  const hiddenCount = creditedCast.length - 15;

  // Filmography filtering
  const filteredFilmography = useMemo(() => {
    if (!filmographySearch.trim()) return filmography;
    const query = filmographySearch.toLowerCase();
    return filmography.filter(m => m.title?.toLowerCase().includes(query));
  }, [filmography, filmographySearch]);

  // Move indicator dots
  const totalMoves = DIFFICULTY_MOVES[difficulty];
  const moveDots = Array.from({ length: totalMoves }, (_, i) => i < movesUsed);

  // Get the next available hint level
  const nextHintLevel = hintLevel + 1;

  // When actor changes, clear search
  const onActorSelect = (actor) => {
    setFilmographySearch('');
    handleActorSelect(actor);
  };

  return (
    <div className="game-board page-transition">
      {/* Compact movie header */}
      <div className="movies-header animate-in">
        <div className="header-content">
          <div className="movie-pair">
            <div className="current-section">
              <h4>Current:</h4>
              <div className="compact-movie-card">
                {currentMovie.poster_path ? (
                  <img src={POSTER_BASE_URL + currentMovie.poster_path} alt={currentMovie.title} />
                ) : (
                  <div className="movie-placeholder">🎬</div>
                )}
                <div className="movie-title">{currentMovie.title}</div>
              </div>
            </div>

            <div className="vs-divider">
              <span className="vs-icon">→</span>
              <div className="steps-counter">
                <span className="steps-number">{movesRemaining}</span>
                <span className="steps-label">left</span>
              </div>
            </div>

            <div className="target-section">
              <h4>Target:</h4>
              <div
                className="compact-movie-card"
                onClick={() => gameDispatch({ type: 'TOGGLE_TARGET_CAST' })}
                style={{ cursor: 'pointer' }}
              >
                {targetMovie.poster_path ? (
                  <img src={POSTER_BASE_URL + targetMovie.poster_path} alt={targetMovie.title} />
                ) : (
                  <div className="movie-placeholder">🎬</div>
                )}
                <div className="movie-title">{targetMovie.title}</div>
              </div>
            </div>
          </div>

          {/* Move indicator dots + undo */}
          <div className="moves-bar">
            <div className="move-dots">
              {moveDots.map((used, i) => (
                <span
                  key={i}
                  className={`move-dot ${used ? 'move-dot-used' : ''}`}
                />
              ))}
            </div>
            {gameChain.length > 1 && (
              <button
                className="undo-button"
                onClick={() => gameDispatch({ type: 'UNDO_MOVE' })}
                title="Undo last move"
              >
                ↩ Undo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chain visualization */}
      {gameChain.length <= 1 ? (
        <ChainDisplay chain={gameChain} />
      ) : (
        <div className="game-chain animate-in animate-in-delay-1">
          <h2>Your Movie Chain</h2>
          <ChainDisplay chain={gameChain} />
        </div>
      )}

      {/* Graduated hint system */}
      <div className="hint-section animate-in animate-in-delay-3">
        {/* Show revealed hints */}
        {hintsUsed.length > 0 && (
          <div className="hints-revealed">
            {hintsUsed.map((hint, i) => (
              <div key={i} className="hint-item fade-in">
                <span className="hint-icon">
                  {hint.level === 1 ? '💡' : hint.level === 2 ? '🔍' : '🎬'}
                </span>
                <span>{hint.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Next hint button */}
        {nextHintLevel <= 3 && (
          <button
            onClick={() => {
              if (nextHintLevel === 1) {
                handleHint(1);
              } else {
                const cost = nextHintLevel === 2 ? 1 : 2;
                if (window.confirm(`This hint costs ${cost} move${cost > 1 ? 's' : ''}. Continue?`)) {
                  handleHint(nextHintLevel);
                }
              }
            }}
            className={`hint-button ${cachedHintChain ? 'hint-ready' : ''}`}
            disabled={hintLoading}
          >
            {nextHintLevel === 1 && '💡 Get Hint (free)'}
            {nextHintLevel === 2 && '🔍 Next Hint (-1 move)'}
            {nextHintLevel === 3 && '🎬 Big Hint (-2 moves)'}
          </button>
        )}

        {hintLoading && (
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading hint data...</div>
          </div>
        )}
      </div>

      {/* Cast or filmography */}
      {selectedActor ? (
        <div className="filmography-section animate-in animate-in-delay-4">
          <h2>Movies with {selectedActor.name}</h2>
          <button className="button-ghost" onClick={() => {
            setFilmographySearch('');
            gameDispatch({ type: 'DESELECT_ACTOR' });
          }}>← Back to Cast</button>

          {/* CHANGE 2: Filmography search box */}
          {!actorLoading && filmography.length > 0 && (
            <div className="filmography-search-wrapper">
              <input
                type="text"
                className="filmography-search"
                placeholder="Search movies..."
                value={filmographySearch}
                onChange={(e) => setFilmographySearch(e.target.value)}
                autoComplete="off"
              />
              <span className="filmography-search-count">
                {filmographySearch
                  ? `${filteredFilmography.length} of ${filmography.length} movies`
                  : `${filmography.length} movies`}
              </span>
            </div>
          )}

          {actorLoading ? (
            <div className="skeleton-grid">
              {[...Array(8)].map((_, i) => (
                <ActorCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredFilmography.length === 0 && filmographySearch ? (
            <div className="filmography-empty">
              <p>No movies found for "{filmographySearch}"</p>
            </div>
          ) : (
            <div className="filmography-list stagger-grid">
              {filteredFilmography.map(m => (
                <div
                  key={m.id}
                  className="filmography-item"
                  onClick={() => handleFilmographySelect(m)}
                >
                  {m.poster_path ? (
                    <img src={POSTER_BASE_URL + m.poster_path} alt={m.title} />
                  ) : (
                    <div className="movie-placeholder">🎬</div>
                  )}
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
            {visibleCast.map(a => (
              <div
                key={a.id}
                className="cast-item"
                onClick={() => onActorSelect(a)}
              >
                <ActorImage actor={a} />
                <p>{a.name}</p>
                <p className="character">as {a.character}</p>
              </div>
            ))}
          </div>
          {!showAllCast && hiddenCount > 0 && (
            <button
              className="show-all-cast-btn"
              onClick={() => setShowAllCast(true)}
            >
              Show all {creditedCast.length} cast members
            </button>
          )}
          {showAllCast && creditedCast.length > 15 && (
            <button
              className="show-all-cast-btn"
              onClick={() => setShowAllCast(false)}
            >
              Show fewer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
