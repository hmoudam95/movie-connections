import React from 'react';
import ChainDisplay from '../components/ChainDisplay';
import { DIFFICULTY_MOVES } from '../state/gameReducer';

function getAchievement(steps, movesUsed, difficulty) {
  const totalMoves = DIFFICULTY_MOVES[difficulty];
  const movesLeft = totalMoves - movesUsed;

  if (steps === 1) return { emoji: '🏆', text: 'LEGENDARY! Perfect Connection!' };
  if (steps === 2 && movesLeft >= totalMoves - 2) return { emoji: '🥇', text: 'AMAZING! Near Perfect!' };
  if (steps <= 4) return { emoji: '🥈', text: 'EXCELLENT! Great Job!' };
  if (steps <= 6) return { emoji: '🥉', text: 'GOOD! Well Done!' };
  return { emoji: '🎯', text: 'COMPLETED! Nice Work!' };
}

export default function VictoryScreen({ gameChain, movesUsed, difficulty, hintsUsed, resetGame, uiDispatch }) {
  const steps = gameChain.length - 1;
  const totalMoves = DIFFICULTY_MOVES[difficulty];
  const achievement = getAchievement(steps, movesUsed, difficulty);

  const handleShare = () => {
    const moveDots = Array.from({ length: totalMoves }, (_, i) =>
      i < movesUsed ? '🟥' : '🟩'
    ).join('');
    const text = `🎬 Movie Connections\n${gameChain[0].movie.title} → ${gameChain[gameChain.length - 1].movie.title}\n${moveDots}\n${steps} steps, ${movesUsed}/${totalMoves} moves${hintsUsed.length > 0 ? `, ${hintsUsed.length} hint${hintsUsed.length > 1 ? 's' : ''}` : ''}\n#MovieConnections`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      uiDispatch({ type: 'SET_ERROR', message: 'Result copied to clipboard! 🎉' });
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
            <span className="stat-label">Steps</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{movesUsed}/{totalMoves}</span>
            <span className="stat-label">Moves Used</span>
          </div>
        </div>

        {/* Move dots visualization */}
        <div className="result-move-dots">
          {Array.from({ length: totalMoves }, (_, i) => (
            <span
              key={i}
              className={`move-dot ${i < movesUsed ? 'move-dot-used' : 'move-dot-saved'}`}
            />
          ))}
        </div>

        {hintsUsed.length > 0 && (
          <p className="hints-used-note">
            {hintsUsed.length} hint{hintsUsed.length > 1 ? 's' : ''} used
          </p>
        )}
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
          📤 Share Result
        </button>
      </div>
    </div>
  );
}
