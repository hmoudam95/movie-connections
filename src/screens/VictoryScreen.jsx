import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChainDisplay from '../components/ChainDisplay';
import { DIFFICULTY_MOVES } from '../state/gameReducer';

const CONFETTI_COLORS = ['#e8b44a', '#818cf8', '#34d399', '#f0f0f5'];

function getAchievement(steps, movesUsed, difficulty) {
  const totalMoves = DIFFICULTY_MOVES[difficulty];
  const movesLeft = totalMoves - movesUsed;
  if (steps === 1) return { emoji: '🏆', text: 'Perfect Connection!' };
  if (steps === 2 && movesLeft >= totalMoves - 2) return { emoji: '🥇', text: 'Near Perfect!' };
  if (steps <= 4) return { emoji: '🥈', text: 'Great Job!' };
  if (steps <= 6) return { emoji: '🥉', text: 'Well Done!' };
  return { emoji: '🎯', text: 'Nice Work!' };
}

function ConfettiParticles() {
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return null;

  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 400,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.3,
    duration: 2 + Math.random() * 1,
    rotation: Math.random() * 720 - 360,
    size: 4 + Math.random() * 6,
  }));

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="confetti-particle"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ x: 0, y: -100, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: 800,
            opacity: [1, 1, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  );
}

export default function VictoryScreen({ gameChain, movesUsed, difficulty, hintsUsed, resetGame, uiDispatch }) {
  const steps = gameChain.length - 1;
  const totalMoves = DIFFICULTY_MOVES[difficulty];
  const movesRemaining = totalMoves - movesUsed;
  const achievement = getAchievement(steps, movesUsed, difficulty);
  const chainScrollRef = useRef(null);

  // Auto-scroll chain to show full path
  useEffect(() => {
    if (chainScrollRef.current) {
      const el = chainScrollRef.current;
      el.scrollLeft = el.scrollWidth;
    }
  }, []);

  // Build share chain text: Movie → Actor → Movie → ...
  const buildChainText = () => {
    const parts = [];
    gameChain.forEach((item, i) => {
      parts.push(item.movie.title);
      if (item.actor) {
        parts.push(item.actor.name);
      }
    });
    return parts.join(' → ');
  };

  const handleShare = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    const chainText = buildChainText();
    const text = `🎬 Movie Connections\n${chainText}\nConnected in ${steps} step${steps > 1 ? 's' : ''} with ${movesRemaining} move${movesRemaining !== 1 ? 's' : ''} to spare!\nPlay at: movie-connections.vercel.app`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      uiDispatch({ type: 'SET_ERROR', message: 'Result copied to clipboard!' });
      setTimeout(() => uiDispatch({ type: 'CLEAR_ERROR' }), 3000);
    }
  };

  return (
    <div className="victory-v4">
      <ConfettiParticles />

      {/* Hero */}
      <motion.div
        className="victory-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="victory-emoji">{achievement.emoji}</span>
        <h1 className="victory-title">Victory!</h1>
        <p className="victory-subtitle">Connected in {steps} step{steps > 1 ? 's' : ''}</p>
      </motion.div>

      {/* Ticket Stub Stats */}
      <motion.div
        className="ticket-stub"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="ticket-watermark">WINNER</div>
        <div className="ticket-stats">
          <div className="ticket-stat">
            <span className="ticket-number">{steps}</span>
            <span className="ticket-label">Steps Used</span>
          </div>
          <div className="ticket-divider" />
          <div className="ticket-stat">
            <span className="ticket-number">{movesRemaining}</span>
            <span className="ticket-label">Moves Left</span>
          </div>
        </div>
        <div className="ticket-dots">
          {Array.from({ length: totalMoves }, (_, i) => (
            <span
              key={i}
              className={`move-dot ${i < movesUsed ? 'move-dot-used' : 'move-dot-saved'}`}
            />
          ))}
        </div>
        {hintsUsed.length > 0 && (
          <p className="ticket-hints">
            {hintsUsed.length} hint{hintsUsed.length > 1 ? 's' : ''} used
          </p>
        )}
      </motion.div>

      {/* Winning Path */}
      <motion.div
        className="victory-chain-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <span className="victory-chain-label">Your Path</span>
        <ChainDisplay
          chain={gameChain}
          targetMovie={gameChain[gameChain.length - 1]?.movie}
          scrollRef={chainScrollRef}
        />
      </motion.div>

      {/* CTAs */}
      <motion.div
        className="victory-ctas"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <motion.button className="cta-primary" onClick={resetGame} whileTap={{ scale: 0.97 }}>
          Play Again
        </motion.button>
        <motion.button className="cta-secondary" onClick={handleShare} whileTap={{ scale: 0.97 }}>
          🎬 Share Result
        </motion.button>
      </motion.div>
    </div>
  );
}
