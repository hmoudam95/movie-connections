import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { POSTER_BASE_URL } from '../utils/constants';

const springChain = { type: 'spring', stiffness: 300, damping: 25 };
const springPop = { type: 'spring', stiffness: 400, damping: 20 };

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/** 32px circular actor photo for chain connectors */
function ChainActorCircle({ actor }) {
  const [error, setError] = useState(false);

  if (!actor.profile_path || error) {
    return (
      <div className="chain-actor-circle chain-actor-circle--initials">
        <span>{getInitials(actor.name)}</span>
      </div>
    );
  }

  return (
    <img
      className="chain-actor-circle"
      src={POSTER_BASE_URL + actor.profile_path}
      alt={actor.name}
      onError={() => setError(true)}
    />
  );
}

/** 40x60 movie poster for chain nodes, with styled fallback */
function ChainPoster({ movie }) {
  const [error, setError] = useState(false);

  if (!movie.poster_path || error) {
    return (
      <div className="chain-poster-fallback">
        <span>{movie.title?.slice(0, 12)}</span>
      </div>
    );
  }

  return (
    <img
      className="chain-poster-img"
      src={POSTER_BASE_URL + movie.poster_path}
      alt={movie.title}
      onError={() => setError(true)}
    />
  );
}

/**
 * ChainDisplay renders in two modes:
 * 1. Rail mode (when targetMovie is provided) — horizontal scrollable rail for gameplay
 * 2. Legacy mode (no targetMovie) — wrapped flex layout for victory/gameover screens
 */
export default function ChainDisplay({ chain, targetMovie, scrollRef }) {
  // Legacy mode for victory/gameover screens
  if (!targetMovie) {
    return (
      <div className="chain-items">
        {chain.map((item, idx) => (
          <div key={idx} className="chain-item">
            <div className="chain-movie">
              {item.movie.poster_path ? (
                <img src={POSTER_BASE_URL + item.movie.poster_path} alt={item.movie.title} />
              ) : (
                <div className="movie-placeholder">🎬</div>
              )}
              <p>{item.movie.title}</p>
            </div>
            {item.actor && (
              <>
                <span className="chain-via">via</span>
                <div className="chain-actor">
                  <ChainActorCircle actor={item.actor} />
                  <p>{item.actor.name}</p>
                </div>
              </>
            )}
            {idx < chain.length - 1 && (
              <div className="chain-arrow">→</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Rail mode for gameplay
  return (
    <div className="chain-rail" ref={scrollRef}>
      <div className="chain-rail-track">
        {chain.map((item, idx) => (
          <React.Fragment key={idx}>
            {/* Movie node */}
            <motion.div
              className="chain-node"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springChain}
            >
              <div className="chain-node-poster">
                <ChainPoster movie={item.movie} />
              </div>
              <span className="chain-node-title">{item.movie.title}</span>
            </motion.div>

            {/* Actor connector (between movies) */}
            {item.actor && (
              <div className="chain-connector">
                <motion.div
                  className="chain-connector-line"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'left' }}
                />
                <motion.div
                  className="chain-connector-actor"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...springPop, delay: 0.15 }}
                >
                  <ChainActorCircle actor={item.actor} />
                </motion.div>
                <motion.div
                  className="chain-connector-line"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.15 }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
            )}
          </React.Fragment>
        ))}

        {/* If only starting movie, show dashed line to greyed-out target */}
        {chain.length === 1 && (
          <>
            <div className="chain-connector chain-connector--dashed">
              <div className="chain-connector-line chain-connector-line--dashed" />
              <div className="chain-connector-qmark">?</div>
              <div className="chain-connector-line chain-connector-line--dashed" />
            </div>
            <div className="chain-node chain-node--ghost">
              <div className="chain-node-poster">
                <ChainPoster movie={targetMovie} />
              </div>
              <span className="chain-node-title">{targetMovie.title}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
