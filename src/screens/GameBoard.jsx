import React, { useState, useMemo } from 'react';
import ActorImage from '../components/ActorImage';
import ActorCardSkeleton from '../components/ActorCardSkeleton';
import ChainDisplay from '../components/ChainDisplay';
import { POSTER_BASE_URL } from '../utils/constants';

export default function GameBoard({
  currentMovie, targetMovie, gameChain, selectedActor,
  cast, filmography, hintChain, cachedHintChain,
  actorLoading, hintLoading,
  gameDispatch, handleActorSelect, handleFilmographySelect, fetchHint,
}) {
  const [showAllCast, setShowAllCast] = useState(false);

  const creditedCast = useMemo(
    () => cast.filter(a => !a.character?.toLowerCase().includes('uncredited')),
    [cast]
  );
  const visibleCast = showAllCast ? creditedCast : creditedCast.slice(0, 15);
  const hiddenCount = creditedCast.length - 15;

  return (
    <div className="game-board page-transition">
      {/* Compact movie header */}
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

      {/* Chain visualization */}
      {gameChain.length <= 1 ? (
        <ChainDisplay chain={gameChain} />
      ) : (
        <div className="game-chain animate-in animate-in-delay-1">
          <h2>Your Movie Chain</h2>
          <ChainDisplay chain={gameChain} />
        </div>
      )}

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
            {visibleCast.map(a => (
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
