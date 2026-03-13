import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ChainDisplay from '../components/ChainDisplay';
import { DIFFICULTY_MOVES } from '../state/gameReducer';

export default function GameOverScreen({ gameChain, cachedHintChain, movesUsed, difficulty, resetGame }) {
  const totalMoves = DIFFICULTY_MOVES[difficulty];
  const optimalRef = useRef(null);
  const playerRef = useRef(null);

  // Auto-scroll chains
  useEffect(() => {
    if (optimalRef.current) {
      optimalRef.current.scrollLeft = optimalRef.current.scrollWidth;
    }
    if (playerRef.current) {
      playerRef.current.scrollLeft = playerRef.current.scrollWidth;
    }
  }, []);

  // Convert cachedHintChain (flat node array) to chain format for ChainDisplay
  const optimalChainFormatted = useMemo(() => {
    if (!cachedHintChain || cachedHintChain.length === 0) return null;
    const chain = [];
    // cachedHintChain is alternating Movie, Actor, Movie, Actor, Movie...
    for (let i = 0; i < cachedHintChain.length; i++) {
      const node = cachedHintChain[i];
      if (node.type === 'Movie') {
        chain.push({
          movie: {
            id: node.id,
            title: node.title,
            poster_path: node.poster_path || null,
          },
          actor: null,
        });
      } else if (node.type === 'Actor' && chain.length > 0) {
        chain[chain.length - 1].actor = {
          id: node.id,
          name: node.title,
          profile_path: node.profile_path || null,
        };
      }
    }
    return chain;
  }, [cachedHintChain]);

  // Set of movie IDs the player visited (for gold tint on optimal path)
  const playerMovieIds = useMemo(() => {
    return new Set(gameChain.map(item => item.movie.id));
  }, [gameChain]);

  return (
    <motion.div
      className="gameover-v4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Hero */}
      <div className="gameover-hero">
        <span className="gameover-emoji">🎬</span>
        <h1 className="gameover-title">That's a Wrap</h1>
        <p className="gameover-subtitle">You ran out of moves</p>
      </div>

      {/* Ticket Stub Stats */}
      <motion.div
        className="ticket-stub ticket-stub--muted"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="ticket-watermark">GAME OVER</div>
        <div className="ticket-stats">
          <div className="ticket-stat">
            <span className="ticket-number ticket-number--muted">{movesUsed}</span>
            <span className="ticket-label">Steps Attempted</span>
          </div>
          <div className="ticket-divider" />
          <div className="ticket-stat">
            <span className="ticket-number ticket-number--muted">{gameChain.length}</span>
            <span className="ticket-label">Movies Found</span>
          </div>
        </div>
        <div className="ticket-dots">
          {Array.from({ length: totalMoves }, (_, i) => (
            <span key={i} className="move-dot move-dot-used" />
          ))}
        </div>
      </motion.div>

      {/* Optimal Path Reveal */}
      {optimalChainFormatted && optimalChainFormatted.length > 1 && (
        <motion.div
          className="gameover-chain-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <span className="gameover-chain-label">The Connection Was...</span>
          <ChainDisplay
            chain={optimalChainFormatted}
            targetMovie={optimalChainFormatted[optimalChainFormatted.length - 1]?.movie}
            scrollRef={optimalRef}
          />
        </motion.div>
      )}

      {/* Player's Journey */}
      {gameChain.length > 1 && (
        <motion.div
          className="gameover-chain-section gameover-chain-section--muted"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <span className="gameover-chain-label">Your Journey</span>
          <ChainDisplay
            chain={gameChain}
            targetMovie={gameChain[gameChain.length - 1]?.movie}
            scrollRef={playerRef}
          />
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        className="gameover-cta"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <motion.button className="cta-primary" onClick={resetGame} whileTap={{ scale: 0.97 }}>
          Try Again
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
