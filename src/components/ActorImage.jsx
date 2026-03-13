import React, { useState } from 'react';
import { POSTER_BASE_URL } from '../utils/constants';

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export default function ActorImage({ actor, className = "" }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!actor.profile_path || imageError) {
    return (
      <div className={`actor-placeholder ${className}`}>
        <span className="actor-initials">{getInitials(actor.name)}</span>
      </div>
    );
  }

  return (
    <>
      {imageLoading && <div className={`actor-loading ${className}`}></div>}
      <img
        className={`${className} ${imageLoading ? 'loading' : ''}`}
        src={POSTER_BASE_URL + actor.profile_path}
        alt={actor.name}
        onLoad={() => { setImageLoading(false); setImageError(false); }}
        onError={() => { setImageLoading(false); setImageError(true); }}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </>
  );
}
