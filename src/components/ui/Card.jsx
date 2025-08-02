import React from 'react';
import { clsx } from 'clsx';

const Card = React.forwardRef(({
  children,
  variant = 'default',
  className = '',
  hover = true,
  shimmer = false,
  glow = false,
  onClick,
  ...props
}, ref) => {
  const baseClasses = 'relative overflow-hidden transition-all duration-300 border';
  
  const variants = {
    default: 'bg-gradient-to-br from-dark-800 to-dark-700 border-dark-600 text-white',
    primary: 'bg-gradient-to-br from-primary-900/50 to-primary-800/50 border-primary-500/30 text-white',
    secondary: 'bg-gradient-to-br from-secondary-900/50 to-secondary-800/50 border-secondary-500/30 text-white',
    accent: 'bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border-cyan-500/30 text-white',
    glass: 'bg-white/10 backdrop-blur-md border-white/20 text-white',
    movie: 'bg-gradient-to-br from-dark-800 to-dark-700 border-primary-500/30 text-white',
    actor: 'bg-gradient-to-br from-dark-700 to-dark-600 border-cyan-500/30 text-white',
    success: 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/30 text-white',
    warning: 'bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-yellow-500/30 text-white',
    danger: 'bg-gradient-to-br from-red-900/50 to-pink-900/50 border-red-500/30 text-white',
  };
  
  const hoverEffects = hover ? {
    default: 'hover:border-primary-500/50 hover:shadow-movie-lg hover:scale-105 hover:-translate-y-2',
    primary: 'hover:border-primary-400 hover:shadow-neon-purple hover:scale-105 hover:-translate-y-2',
    secondary: 'hover:border-secondary-400 hover:shadow-neon-blue hover:scale-105 hover:-translate-y-2',
    accent: 'hover:border-cyan-400 hover:shadow-neon-cyan hover:scale-105 hover:-translate-y-2',
    glass: 'hover:bg-white/15 hover:border-white/30 hover:shadow-lg hover:scale-105 hover:-translate-y-2',
    movie: 'hover:border-primary-400 hover:shadow-neon-purple hover:scale-105 hover:-translate-y-2',
    actor: 'hover:border-cyan-400 hover:shadow-neon-cyan hover:scale-110 hover:rotate-1',
    success: 'hover:border-green-400 hover:shadow-neon-green hover:scale-105 hover:-translate-y-2',
    warning: 'hover:border-yellow-400 hover:shadow-neon-yellow hover:scale-105 hover:-translate-y-2',
    danger: 'hover:border-red-400 hover:shadow-neon-red hover:scale-105 hover:-translate-y-2',
  } : {};
  
  const glowEffects = glow ? 'animate-glow' : '';
  const shimmerEffects = shimmer ? 'shimmer' : '';
  const cursorClass = onClick ? 'cursor-pointer' : '';

  const classes = clsx(
    baseClasses,
    variants[variant],
    hoverEffects[variant],
    glowEffects,
    shimmerEffects,
    cursorClass,
    className
  );

  return (
    <div
      ref={ref}
      className={classes}
      onClick={onClick}
      {...props}
    >
      {/* Shimmer effect overlay */}
      {shimmer && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

// Card Header Component
const CardHeader = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('p-6 pb-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

// Card Content Component
const CardContent = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

// Card Footer Component
const CardFooter = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

// Card Title Component
const CardTitle = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <h3
      ref={ref}
      className={clsx('text-xl font-bold text-gradient mb-2', className)}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

// Card Description Component
const CardDescription = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={clsx('text-dark-300 text-sm', className)}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

// Movie Card Component
const MovieCard = React.forwardRef(({
  children,
  className = '',
  poster,
  title,
  year,
  rating,
  ...props
}, ref) => {
  return (
    <Card
      ref={ref}
      variant="movie"
      className={clsx('movie-card', className)}
      {...props}
    >
      <div className="flex flex-col h-full">
        {poster && (
          <div className="relative mb-4">
            <img
              src={poster}
              alt={title}
              className="w-full h-48 object-cover rounded-xl movie-poster"
            />
            {rating && (
              <div className="absolute top-2 right-2 bg-primary-600/90 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                ⭐ {rating}
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1">
          <CardTitle>{title}</CardTitle>
          {year && (
            <CardDescription>({year})</CardDescription>
          )}
        </div>
        
        {children}
      </div>
    </Card>
  );
});

MovieCard.displayName = 'MovieCard';

// Actor Card Component
const ActorCard = React.forwardRef(({
  children,
  className = '',
  photo,
  name,
  character,
  ...props
}, ref) => {
  return (
    <Card
      ref={ref}
      variant="actor"
      className={clsx('actor-card', className)}
      {...props}
    >
      <div className="flex flex-col items-center text-center">
        {photo && (
          <div className="relative mb-3">
            <img
              src={photo}
              alt={name}
              className="w-16 h-16 object-cover rounded-full border-2 border-cyan-500/50"
            />
          </div>
        )}
        
        <div className="flex-1">
          <h4 className="actor-name text-sm font-semibold mb-1">{name}</h4>
          {character && (
            <p className="text-dark-400 text-xs">as {character}</p>
          )}
        </div>
        
        {children}
      </div>
    </Card>
  );
});

ActorCard.displayName = 'ActorCard';

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Movie = MovieCard;
Card.Actor = ActorCard;

export default Card; 