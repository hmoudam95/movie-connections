import React from 'react';

export default function ErrorState({ title, description, onRetry, retryText = "Try Again" }) {
  return (
    <div className="error-state fade-in">
      <div className="error-icon">⚠️</div>
      <div className="error-title">{title}</div>
      <div className="error-description">{description}</div>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          {retryText}
        </button>
      )}
    </div>
  );
}
