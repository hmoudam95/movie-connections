import React from 'react';
import { clsx } from 'clsx';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = 'game-button inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white shadow-lg hover:shadow-glow focus:ring-primary-400 focus:ring-offset-dark-900',
    secondary: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-neon-cyan focus:ring-cyan-400 focus:ring-offset-dark-900',
    accent: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg hover:shadow-neon-pink focus:ring-pink-400 focus:ring-offset-dark-900',
    outline: 'bg-transparent border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white focus:ring-primary-400 focus:ring-offset-dark-900',
    ghost: 'bg-transparent text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 focus:ring-primary-400 focus:ring-offset-dark-900',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg hover:shadow-neon-red focus:ring-red-400 focus:ring-offset-dark-900',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-neon-green focus:ring-green-400 focus:ring-offset-dark-900',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg hover:shadow-neon-yellow focus:ring-yellow-400 focus:ring-offset-dark-900',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
    xl: 'px-8 py-4 text-xl rounded-2xl',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

  const iconClasses = clsx(
    iconSizes[size],
    'transition-transform duration-200'
  );

  const renderIcon = () => {
    if (!icon) return null;
    
    const IconComponent = icon;
    return (
      <IconComponent 
        className={clsx(
          iconClasses,
          iconPosition === 'right' ? 'ml-2' : 'mr-2',
          loading && 'animate-spin'
        )} 
      />
    );
  };

  const renderLoadingSpinner = () => {
    if (!loading) return null;
    
    return (
      <div className={clsx(
        'loading-spinner',
        iconPosition === 'right' ? 'ml-2' : 'mr-2'
      )} />
    );
  };

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
      
      {/* Content */}
      <div className="relative flex items-center">
        {iconPosition === 'left' && (loading ? renderLoadingSpinner() : renderIcon())}
        {children}
        {iconPosition === 'right' && (loading ? renderLoadingSpinner() : renderIcon())}
      </div>
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 