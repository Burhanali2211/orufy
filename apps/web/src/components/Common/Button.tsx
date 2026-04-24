import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { designTokens } from '@/lib/design-tokens';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  mobileOptimized?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  ariaLabel,
  title,
  mobileOptimized = false,
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Mobile-optimized classes for touch interaction
  const mobileClasses = mobileOptimized
    ? 'touch-manipulation select-none active:scale-95 transition-transform duration-150'
    : '';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-500',
    secondary: 'bg-white text-purple-700 hover:bg-purple-100 focus:ring-purple-500',
    ghost: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 focus:ring-purple-500',
  };

  // Enhanced size classes with mobile-optimized touch targets (reduced from 44-56px to prevent mobile bulge)
  const sizeClasses = {
    sm: mobileOptimized ? 'min-h-[38px] min-w-[38px] px-3 py-1.5 text-sm rounded-md' : 'px-3 py-1.5 text-sm rounded-md',
    md: mobileOptimized ? 'min-h-[42px] min-w-[42px] px-4 py-2 text-sm rounded-lg' : 'px-4 py-2 text-sm rounded-lg',
    lg: mobileOptimized ? 'min-h-[48px] min-w-[48px] px-5 py-3 text-base rounded-lg' : 'px-6 py-3 text-base rounded-lg',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${mobileClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      aria-label={ariaLabel}
      title={title}
    >
      {loading ? (
        <div className={`${iconSizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : (
        <>
          {Icon && (
            <Icon className={`${iconSizeClasses[size]} ${children ? 'mr-2' : ''}`} />
          )}
          {children}
        </>
      )}
    </button>
  );
};

// Badge component for notifications, cart count, etc.
interface BadgeProps {
  count: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  variant = 'default',
  className = ''
}) => {
  if (count <= 0) return null;

  const variantClasses = {
    default: 'bg-neutral-900 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-orange-500 text-white',
    error: 'bg-red-500 text-white',
  };

  return (
    <span
      className={`absolute -top-1 -right-1 h-4 w-4 text-xs rounded-full flex items-center justify-center font-medium transition-transform duration-150 ${variantClasses[variant]} ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Touch target sizing standards for mobile optimization
export const TOUCH_TARGETS = {
  minimum: '44px',
  comfortable: '48px',
  optimal: '56px',
  spacing: '8px'
} as const;

interface MobileTouchButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'minimum' | 'comfortable' | 'optimal';
  loading?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
}

export const MobileTouchButton: React.FC<MobileTouchButtonProps> = ({
  children,
  onClick,
  className = '',
  icon: Icon,
  variant = 'primary',
  size = 'comfortable',
  loading = false,
  disabled = false,
  ariaLabel,
  title,
  fullWidth = false,
  hapticFeedback = false,
}) => {
  const baseClasses = `relative inline-flex items-center justify-center font-medium touch-manipulation select-none transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 active:transition-transform active:duration-100 ${fullWidth ? 'w-full' : ''}`;

  const variantClasses = {
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-500 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 focus:ring-neutral-500 shadow-sm hover:shadow-md',
    ghost: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
  };

  const sizeClasses = {
    minimum: 'min-h-[38px] min-w-[38px] px-2.5 sm:px-3 py-1.5 text-xs rounded-md',
    comfortable: 'min-h-[42px] min-w-[42px] px-3 sm:px-4 py-2 text-sm rounded-md',
    optimal: 'min-h-[48px] min-w-[48px] px-4 sm:px-5 py-2.5 text-base rounded-lg',
  };

  const iconSizeClasses = {
    minimum: 'h-3 w-3',
    comfortable: 'h-3.5 w-3.5',
    optimal: 'h-4 w-4',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={ariaLabel}
      title={title}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {loading ? (
        <div className={`${iconSizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : (
        <>
          {Icon && <Icon className={`${iconSizeClasses[size]} ${children ? 'mr-1.5' : ''}`} />}
          {children}
        </>
      )}
    </motion.button>
  );
};

interface MobileIconButtonProps {
  icon: LucideIcon;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'minimum' | 'comfortable' | 'optimal';
  disabled?: boolean;
  ariaLabel: string;
  active?: boolean;
}

export const MobileIconButton: React.FC<MobileIconButtonProps> = ({
  icon: Icon,
  onClick,
  className = '',
  variant = 'ghost',
  size = 'comfortable',
  disabled = false,
  ariaLabel,
  active = false,
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center touch-manipulation select-none transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-90 active:transition-transform active:duration-100 rounded-full';

  const variantClasses = {
    primary: active
      ? 'bg-neutral-900 text-white shadow-md'
      : 'bg-white text-neutral-600 hover:bg-neutral-900 hover:text-white border border-neutral-200 shadow-sm',
    secondary: active
      ? 'bg-neutral-100 text-neutral-900 shadow-md'
      : 'bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200 shadow-sm',
    ghost: active
      ? 'bg-neutral-100 text-neutral-900'
      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
  };

  const sizeClasses = {
    minimum: 'h-[38px] w-[38px]',
    comfortable: 'h-[42px] w-[42px]',
    optimal: 'h-[48px] w-[48px]',
  };

  const iconSizeClasses = {
    minimum: 'h-3.5 w-3.5',
    comfortable: 'h-4 w-4',
    optimal: 'h-5 w-5',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Icon className={iconSizeClasses[size]} />
    </motion.button>
  );
};

interface MobileFABProps {
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  ariaLabel: string;
}

export const MobileFAB: React.FC<MobileFABProps> = ({
  icon: Icon,
  onClick,
  className = '',
  variant = 'primary',
  position = 'bottom-right',
  ariaLabel,
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
  };

  const variantClasses = {
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 shadow-lg hover:shadow-xl',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${positionClasses[position]} ${variantClasses[variant]} h-12 w-12 rounded-full touch-manipulation select-none transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 flex items-center justify-center ${className}`}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  );
};

// Tooltip component for enhanced UX
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'bottom'
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-neutral-900 rounded-md whitespace-nowrap transition-opacity duration-150 ${positionClasses[position]}`}
        >
          {content}
          <div className={`absolute w-2 h-2 bg-neutral-900 rotate-45 ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
                'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`} />
        </div>
      )}
    </div>
  );
};
