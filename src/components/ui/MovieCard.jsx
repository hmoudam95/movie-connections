import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { PlayIcon, StarIcon, HeartIcon, ShareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

const MovieCard = ({
  movie,
  onClick,
  className = '',
  variant = 'default',
  showActions = true,
  showRating = true,
  showYear = true,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Motion values for 3D effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform mouse position to rotation
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);
  
  // Transform mouse position to glow position
  const glowX = useTransform(mouseX, [-300, 300], [-50, 50]);
  const glowY = useTransform(mouseY, [-300, 300], [-50, 50]);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const variants = {
    default: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      glowColor: '#6366f1',
    },
    action: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      glowColor: '#ec4899',
    },
    thriller: {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      glowColor: '#06b6d4',
    },
    comedy: {
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      glowColor: '#10b981',
    },
    horror: {
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      glowColor: '#f59e0b',
    },
  };

  const variant = variants[variant] || variants.default;

  return (
    <motion.div
      className={clsx(
        'relative group cursor-pointer perspective-1000',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {/* 3D Card Container */}
      <motion.div
        className="relative w-full h-full transform-style-preserve-3d"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Main Card */}
        <motion.div
          className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-dark-800 to-dark-700 border border-dark-600"
          style={{
            background: variant.background,
            transform: 'translateZ(0)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Glow Effect Overlay */}
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(600px circle at ${glowX}px ${glowY}px, ${variant.glowColor}20, transparent 40%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Poster Image */}
          <div className="relative w-full h-64 overflow-hidden">
            <motion.img
              src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder-movie.jpg'}
              alt={movie.title}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1 }}
              animate={{ scale: isHovered ? 1.15 : 1.1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Top Actions */}
            {showActions && (
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.button
                  className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLiked(!isLiked);
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isLiked ? (
                      <motion.div
                        key="liked"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="not-liked"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <HeartIcon className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
                
                <motion.button
                  className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ShareIcon className="w-4 h-4" />
                </motion.button>
              </div>
            )}

            {/* Rating Badge */}
            {showRating && movie.vote_average && (
              <motion.div
                className="absolute top-3 left-3 bg-yellow-500/90 backdrop-blur-sm text-black px-2 py-1 rounded-lg text-sm font-bold flex items-center gap-1"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <StarIcon className="w-3 h-3 fill-current" />
                {movie.vote_average.toFixed(1)}
              </motion.div>
            )}

            {/* Play Button Overlay */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ scale: 0.8 }}
              animate={{ scale: isHovered ? 1 : 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                whileTap={{ scale: 0.9 }}
              >
                <PlayIcon className="w-8 h-8 text-white ml-1" />
              </motion.div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-4 relative z-10">
            {/* Title */}
            <motion.h3
              className="text-lg font-bold text-white mb-2 line-clamp-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {movie.title}
            </motion.h3>

            {/* Year */}
            {showYear && movie.release_date && (
              <motion.p
                className="text-sm text-gray-300 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {new Date(movie.release_date).getFullYear()}
              </motion.p>
            )}

            {/* Genres (if available) */}
            {movie.genre_ids && (
              <motion.div
                className="flex flex-wrap gap-1 mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                {movie.genre_ids.slice(0, 2).map((genreId, index) => (
                  <span
                    key={genreId}
                    className="text-xs px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/80"
                  >
                    Genre {index + 1}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Bottom Actions */}
            {showActions && (
              <motion.div
                className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <motion.button
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <EyeIcon className="w-4 h-4" />
                  Details
                </motion.button>
                
                <motion.button
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Watch
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Glowing Border */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-transparent"
            style={{
              background: `linear-gradient(45deg, transparent, ${variant.glowColor}40, transparent)`,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Shadow */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-black/20 blur-xl -z-10"
          style={{
            transform: 'translateZ(-10px)',
          }}
          animate={{
            opacity: isHovered ? 0.8 : 0.4,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Floating Particles Effect */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/60 rounded-full pointer-events-none"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + i * 10}%`,
                }}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [-10, -30, -50],
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MovieCard; 