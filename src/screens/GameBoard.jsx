import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ActorImage from '../components/ActorImage';
import ActorCardSkeleton from '../components/ActorCardSkeleton';
import ChainDisplay from '../components/ChainDisplay';
import { POSTER_BASE_URL } from '../utils/constants';
import { DIFFICULTY_MOVES } from '../state/gameReducer';

const springGentle = { type: 'spring', stiffness: 200, damping: 24 };
const springSnappy = { type: 'spring', stiffness: 400, damping: 25 };

export default function GameBoard({
  currentMovie, targetMovie, gameChain, selectedActor,
  cast, filmography, cachedHintChain,
  hintLevel, hintsUsed, movesRemaining, movesUsed, difficulty,
  actorLoading, hintLoading, pendingHintLevel,
  gameDispatch, handleActorSelect, handleFilmographySelect, handleHint,
}) {
  const isHintPending = pendingHintLevel != null;
  const [showAllCast, setShowAllCast] = useState(false);
  const [filmographySearch, setFilmographySearch] = useState('');
  const chainScrollRef = useRef(null);
  const prevMovesUsed = useRef(movesUsed);

  const creditedCast = useMemo(
    () => cast.filter(a => !a.character?.toLowerCase().includes('uncredited')),
    [cast]
  );
  const visibleCast = showAllCast ? creditedCast : creditedCast.slice(0, 15);
  const hiddenCount = creditedCast.length - 15;

  // Filmography filtering + decade grouping
  const filteredFilmography = useMemo(() => {
    if (!filmographySearch.trim()) return filmography;
    const query = filmographySearch.toLowerCase();
    return filmography.filter(m => m.title?.toLowerCase().includes(query));
  }, [filmography, filmographySearch]);

  const groupedFilmography = useMemo(() => {
    if (filmography.length < 30 || filmographySearch.trim()) return null;
    const groups = {};
    filteredFilmography.forEach(m => {
      const year = parseInt(m.release_date?.slice(0, 4));
      if (!year) return;
      const decade = `${Math.floor(year / 10) * 10}s`;
      if (!groups[decade]) groups[decade] = [];
      groups[decade].push(m);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredFilmography, filmography.length, filmographySearch]);

  // Move indicator dots
  const totalMoves = DIFFICULTY_MOVES[difficulty];
  const moveDots = Array.from({ length: totalMoves }, (_, i) => i < movesUsed);

  // Detect if a move was just used (for dot animation)
  const justUsedMove = movesUsed > prevMovesUsed.current;
  useEffect(() => {
    prevMovesUsed.current = movesUsed;
  }, [movesUsed]);

  // Get the next available hint level
  const nextHintLevel = hintLevel + 1;

  // When actor changes, clear search
  const onActorSelect = (actor) => {
    setFilmographySearch('');
    handleActorSelect(actor);
  };

  // Auto-scroll chain rail to the right when new nodes added
  useEffect(() => {
    if (chainScrollRef.current) {
      chainScrollRef.current.scrollLeft = chainScrollRef.current.scrollWidth;
    }
  }, [gameChain.length]);

  // Top 3 actor IDs for gold dot indicator
  const top3ActorIds = useMemo(() => {
    return new Set(creditedCast.slice(0, 3).map(a => a.id));
  }, [creditedCast]);

  return (
    <div className="game-board">
      {/* ===== STICKY GAME HEADER ===== */}
      <div className="game-header">
        <div className="game-header-inner">
          <div className="game-header-movies">
            {/* Current movie */}
            <div className="game-header-movie">
              <div className="game-header-poster">
                {currentMovie.poster_path ? (
                  <img src={POSTER_BASE_URL + currentMovie.poster_path} alt={currentMovie.title} />
                ) : (
                  <div className="movie-placeholder" style={{ width: 52, height: 78 }}>🎬</div>
                )}
              </div>
              <div className="game-header-movie-info">
                <span className="game-header-label">Current</span>
                <span className="game-header-title">{currentMovie.title}</span>
              </div>
            </div>

            {/* Center move counter */}
            <div className="game-header-center">
              <span className="game-header-count">{movesRemaining}</span>
              <span className="game-header-count-label">moves</span>
              <div className="game-header-dots">
                {moveDots.map((used, i) => (
                  <motion.span
                    key={i}
                    className={`game-header-dot ${used ? 'game-header-dot--used' : ''}`}
                    animate={
                      justUsedMove && i === movesUsed - 1
                        ? { scale: [1, 1.3, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.3, ...springSnappy }}
                  />
                ))}
              </div>
            </div>

            {/* Target movie */}
            <div className="game-header-movie game-header-movie--target">
              <div className="game-header-poster">
                {targetMovie.poster_path ? (
                  <img
                    src={POSTER_BASE_URL + targetMovie.poster_path}
                    alt={targetMovie.title}
                    onClick={() => gameDispatch({ type: 'TOGGLE_TARGET_CAST' })}
                    style={{ cursor: 'pointer' }}
                  />
                ) : (
                  <div className="movie-placeholder" style={{ width: 52, height: 78 }}>🎬</div>
                )}
              </div>
              <div className="game-header-movie-info">
                <span className="game-header-label">Target</span>
                <span className="game-header-title">{targetMovie.title}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CHAIN DISPLAY (horizontal rail) ===== */}
      <div className="chain-rail-section">
        <ChainDisplay chain={gameChain} targetMovie={targetMovie} scrollRef={chainScrollRef} />
      </div>

      {/* ===== HINT SECTION ===== */}
      <div className="hint-section-v3">
        <AnimatePresence>
          {hintsUsed.map((hint, i) => (
            <motion.div
              key={i}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springGentle}
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                className={`hint-chip hint-chip--level${hint.level}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                {hint.level === 1 && (
                  <>
                    <svg className="hint-chip-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path d="M10 2a6 6 0 00-2 11.66V16a1 1 0 001 1h2a1 1 0 001-1v-2.34A6 6 0 0010 2zm0 9a3 3 0 110-6 3 3 0 010 6z"/>
                    </svg>
                    <span>{hint.content}</span>
                  </>
                )}
                {hint.level === 2 && (
                  <div className="hint-chip-body">
                    <span className="hint-chip-label">Key Actor</span>
                    <span className="hint-chip-value">{hint.content}</span>
                  </div>
                )}
                {hint.level === 3 && (
                  <div className="hint-chip-body">
                    <span className="hint-chip-label">Key Film</span>
                    <span className="hint-chip-value">{hint.content}</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ===== CAST GRID or FILMOGRAPHY ===== */}
      <AnimatePresence mode="wait">
        {selectedActor ? (
          <motion.div
            key="filmography"
            className="filmography-section-v3"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="filmography-header-v3">
              <button className="back-button-v3" onClick={() => {
                setFilmographySearch('');
                gameDispatch({ type: 'DESELECT_ACTOR' });
              }}>
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Back to Cast
              </button>
              <h2 className="filmography-title-v3">{selectedActor.name}'s Films</h2>
            </div>

            {/* Search box */}
            {!actorLoading && filmography.length > 0 && (
              <div className="filmography-search-v3">
                <svg className="filmography-search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={filmographySearch}
                  onChange={(e) => setFilmographySearch(e.target.value)}
                  autoComplete="off"
                />
                <span className="filmography-search-badge">
                  {filmographySearch
                    ? `${filteredFilmography.length} of ${filmography.length}`
                    : `${filmography.length} films`}
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
            ) : filmography.length === 0 ? (
              <div className="filmography-empty">
                <p>No filmography available for {selectedActor.name} — pick another actor.</p>
                <button
                  className="back-button-v3"
                  onClick={() => gameDispatch({ type: 'DESELECT_ACTOR' })}
                  style={{ marginTop: 12 }}
                >
                  ← Back to Cast
                </button>
              </div>
            ) : groupedFilmography ? (
              <div className="filmography-grouped-v3">
                {groupedFilmography.map(([decade, movies]) => (
                  <div key={decade} className="filmography-decade">
                    <div className="decade-header">{decade}</div>
                    {movies.map(m => (
                      <motion.div
                        key={m.id}
                        className="filmography-row-v3"
                        onClick={() => handleFilmographySelect(m)}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div className="filmography-row-poster">
                          {m.poster_path ? (
                            <img src={POSTER_BASE_URL + m.poster_path} alt={m.title} />
                          ) : (
                            <div className="movie-placeholder" style={{ width: 45, height: 68 }}>🎬</div>
                          )}
                        </div>
                        <div className="filmography-row-info">
                          <span className="filmography-row-title">{m.title}</span>
                          <span className="filmography-row-year">{m.release_date?.slice(0, 4) || 'N/A'}</span>
                        </div>
                        {m.popularity && (
                          <div className="filmography-row-pop" title={`Popularity: ${Math.round(m.popularity)}`}>
                            <div className="pop-bar" style={{ width: `${Math.min(100, m.popularity / 2)}%` }} />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="filmography-list-v3">
                {filteredFilmography.map(m => (
                  <motion.div
                    key={m.id}
                    className="filmography-row-v3"
                    onClick={() => handleFilmographySelect(m)}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="filmography-row-poster">
                      {m.poster_path ? (
                        <img src={POSTER_BASE_URL + m.poster_path} alt={m.title} />
                      ) : (
                        <div className="movie-placeholder" style={{ width: 45, height: 68 }}>🎬</div>
                      )}
                    </div>
                    <div className="filmography-row-info">
                      <span className="filmography-row-title">{m.title}</span>
                      <span className="filmography-row-year">{m.release_date?.slice(0, 4) || 'N/A'}</span>
                    </div>
                    {m.popularity && (
                      <div className="filmography-row-pop" title={`Popularity: ${Math.round(m.popularity)}`}>
                        <div className="pop-bar" style={{ width: `${Math.min(100, m.popularity / 2)}%` }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="cast"
            className="cast-section-v3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ x: '-30%', opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="cast-title-v3">Who's your connection?</h2>
            {visibleCast.length === 0 ? (
              <div className="cast-grid-v3">
                {[...Array(12)].map((_, i) => (
                  <ActorCardSkeleton key={`cast-skel-${i}`} />
                ))}
              </div>
            ) : null}
            <div className="cast-grid-v3">
              {visibleCast.map((a, idx) => (
                <motion.div
                  key={a.id}
                  className="cast-card-v3"
                  onClick={() => onActorSelect(a)}
                  initial={idx < 10 ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={idx < 10 ? { duration: 0.3, delay: idx * 0.04, ease: 'easeOut' } : { duration: 0 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {top3ActorIds.has(a.id) && <span className="cast-card-gold-dot" />}
                  <div className="cast-card-photo">
                    <ActorImage actor={a} />
                  </div>
                  <div className="cast-card-info">
                    <p className="cast-card-name">{a.name}</p>
                    <p className="cast-card-character">as {a.character}</p>
                  </div>
                </motion.div>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BOTTOM ACTION BAR ===== */}
      <div className="bottom-action-bar">
        <div className="bottom-action-bar-inner">
          {/* Left: Undo */}
          {gameChain.length > 1 ? (
            <motion.button
              className="bottom-undo-btn"
              onClick={() => gameDispatch({ type: 'UNDO_MOVE' })}
              whileTap={{ scale: 0.95 }}
            >
              ↩ Undo
            </motion.button>
          ) : <div />}

          {/* Right: Hint */}
          {nextHintLevel <= 3 ? (
            <motion.button
              onClick={() => {
                if (isHintPending) return;
                if (nextHintLevel === 1) {
                  handleHint(1);
                } else {
                  const cost = nextHintLevel === 2 ? 1 : 2;
                  if (window.confirm(`This hint costs ${cost} move${cost > 1 ? 's' : ''}. Continue?`)) {
                    handleHint(nextHintLevel);
                  }
                }
              }}
              className={`bottom-hint-btn ${cachedHintChain && !isHintPending ? 'hint-ready' : ''} ${isHintPending ? 'hint-pending' : ''}`}
              disabled={hintLoading || isHintPending}
              aria-busy={isHintPending}
              whileTap={isHintPending ? undefined : { scale: 0.95 }}
            >
              {hintLoading || isHintPending ? (
                <span className="hint-pending-inner">
                  <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                  <span className="hint-pending-label">Loading hint…</span>
                </span>
              ) : (
                <>
                  {nextHintLevel === 1 && '💡 Hint (free)'}
                  {nextHintLevel === 2 && '🔍 Hint (-1 move)'}
                  {nextHintLevel === 3 && '🎬 Hint (-2 moves)'}
                </>
              )}
            </motion.button>
          ) : (
            <button className="bottom-hint-btn" disabled>
              No more hints
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
