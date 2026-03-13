import React from 'react';
import ChainDisplay from '../components/ChainDisplay';

function getAchievement(steps) {
  if (steps === 1) return { emoji: '🏆', text: 'LEGENDARY! Perfect Connection!' };
  if (steps === 2) return { emoji: '🥇', text: 'AMAZING! Near Perfect!' };
  if (steps <= 4) return { emoji: '🥈', text: 'EXCELLENT! Great Job!' };
  if (steps <= 6) return { emoji: '🥉', text: 'GOOD! Well Done!' };
  return { emoji: '🎯', text: 'COMPLETED! Nice Work!' };
}

export default function VictoryScreen({ gameChain, resetGame, uiDispatch }) {
  const steps = gameChain.length - 1;
  const achievement = getAchievement(steps);

  const handleShare = () => {
    const text = `🎬 I just connected ${gameChain[0].movie.title} to ${gameChain[gameChain.length - 1].movie.title} in ${steps} steps! Can you beat that? #MovieConnections`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      uiDispatch({ type: 'SET_ERROR', message: 'Victory message copied to clipboard! 🎉' });
      setTimeout(() => uiDispatch({ type: 'CLEAR_ERROR' }), 3000);
    }
  };

  return (
    <div className="result-screen page-transition">
      {/* Victory Header */}
      <div className="victory-header">
        <h1>🎉 Victory!</h1>
        <div className="achievement-badge">
          <span>{achievement.emoji}</span>
          <span>{achievement.text}</span>
        </div>
      </div>

      {/* Victory Stats */}
      <div className="victory-stats">
        <h2>Mission Accomplished!</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{steps}</span>
            <span className="stat-label">Steps Taken</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{gameChain.length}</span>
            <span className="stat-label">Total Movies</span>
          </div>
        </div>
      </div>

      {/* Final Chain Display */}
      <div className="final-chain">
        <h3>🎬 Your Winning Path</h3>
        <ChainDisplay chain={gameChain} />
      </div>

      {/* Action Buttons */}
      <div className="victory-actions">
        <button className="play-again-button" onClick={resetGame}>
          🎮 Play Again
        </button>
        <button className="share-button button-secondary" onClick={handleShare}>
          📤 Share Victory
        </button>
      </div>
    </div>
  );
}
