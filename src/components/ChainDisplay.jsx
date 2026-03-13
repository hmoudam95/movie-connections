import React from 'react';
import ActorImage from './ActorImage';
import { POSTER_BASE_URL } from '../utils/constants';

export default function ChainDisplay({ chain }) {
  return (
    <div className="chain-items">
      {chain.map((item, idx) => (
        <div key={idx} className="chain-item">
          <div className="chain-movie">
            <img
              src={
                item.movie.poster_path
                  ? POSTER_BASE_URL + item.movie.poster_path
                  : '/api/placeholder/100/150'
              }
              alt={item.movie.title}
            />
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
