import React from 'react';
import ChainDisplay from '../components/ChainDisplay';

export default function GameOverScreen({ gameChain, cachedHintChain, movesUsed, difficulty, resetGame }) {
  return (
    <div className="result-screen game-over-screen page-transition">
      {/* Game Over Header */}
      <div className="game-over-header">
        <h1>Game Over</h1>
        <div className="game-over-badge">
          <span>😞</span>
          <span>Out of moves!</span>
        </div>
      </div>

      {/* Stats */}
      <div className="victory-stats">
        <h2>So Close!</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{movesUsed}</span>
            <span className="stat-label">Moves Used</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{gameChain.length}</span>
            <span className="stat-label">Movies Found</span>
          </div>
        </div>
      </div>

      {/* Your chain */}
      <div className="final-chain">
        <h3>Your Path</h3>
        <ChainDisplay chain={gameChain} />
      </div>

      {/* Optimal path reveal */}
      {cachedHintChain && cachedHintChain.length > 0 && (
        <div className="optimal-path-reveal">
          <h3>Optimal Path</h3>
          <div className="optimal-chain">
            {cachedHintChain.map((node, i) => (
              <span key={node.id} className="optimal-node">
                <span className={node.type === 'Actor' ? 'optimal-actor' : 'optimal-movie'}>
                  {node.title}
                </span>
                {i < cachedHintChain.length - 1 && <span className="optimal-arrow"> → </span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="victory-actions">
        <button className="play-again-button" onClick={resetGame}>
          🎮 Try Again
        </button>
      </div>
    </div>
  );
}
