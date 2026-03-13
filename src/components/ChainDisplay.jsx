import React from 'react';
import ActorImage from './ActorImage';
import { POSTER_BASE_URL } from '../utils/constants';

export default function ChainDisplay({ chain }) {
  if (chain.length <= 1) {
    return (
      <div className="chain-compact">
        {chain[0]?.movie.poster_path ? (
          <img src={POSTER_BASE_URL + chain[0].movie.poster_path} alt={chain[0]?.movie.title} />
        ) : (
          <div className="movie-placeholder small">🎬</div>
        )}
        <span>{chain[0]?.movie.title}</span>
      </div>
    );
  }

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
                <ActorImage actor={item.actor} />
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
