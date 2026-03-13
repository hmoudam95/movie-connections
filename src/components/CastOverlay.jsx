import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POSTER_BASE_URL } from '../utils/constants';

export default function CastOverlay({
  showTargetCast, targetMovieCast, targetCastLoading, gameDispatch,
}) {
  return (
    <>
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
                    <p className="cast-name">{actor.name}</p>
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
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 999,
            }}
            onClick={() => gameDispatch({ type: 'HIDE_TARGET_CAST' })}
          />
        )}
      </AnimatePresence>
    </>
  );
}
