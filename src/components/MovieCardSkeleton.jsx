import React from 'react';

export default function MovieCardSkeleton() {
  return (
    <div className="movie-card-skeleton">
      <div className="skeleton skeleton-poster"></div>
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-year"></div>
    </div>
  );
}
