import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// Touch target sizing standards for mobile optimization
export const TOUCH_TARGETS = {
  minimum: '44px',      // Apple HIG minimum
  comfortable: '48px',  // Material Design recommendation
  optimal: '56px',      // Luxury e-commerce standard
  spacing: '8px'        // Minimum spacing between targets
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
  hapticFeedback?: boolean; // For future PWA implementation
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
  const baseClasses = `
    relative inline-flex items-center justify-center font-medium
    touch-manipulation select-none
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    active:scale-95 active:transition-transform active:duration-100
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-500 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 focus:ring-neutral-500 shadow-sm hover:shadow-md',
    ghost: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
  };

  const sizeClasses = {
    minimum: `min-h-[38px] min-w-[38px] px-2.5 sm:px-3 py-1.5 text-xs rounded-md`,
    comfortable: `min-h-[42px] min-w-[42px] px-3 sm:px-4 py-2 text-sm rounded-md`,
    optimal: `min-h-[48px] min-w-[48px] px-4 sm:px-5 py-2.5 text-base rounded-lg`,
  };

  const iconSizeClasses = {
    minimum: 'h-3 w-3',
    comfortable: 'h-3.5 w-3.5',
    optimal: 'h-4 w-4',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Subtle haptic feedback
    }
    onClick?.(e);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      aria-label={ariaLabel}
      title={title}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {loading ? (
        <div className={`${iconSizeClasses[size]} border-2 border-current border-t-transparent rounded-full hidden`} />
      ) : (
        <>
          {Icon && (
            <Icon className={`${iconSizeClasses[size]} ${children ? 'mr-1.5' : ''}`} />
          )}
          {children}
        </>
      )}
    </motion.button>
  );
};

// Mobile-optimized icon button for actions like wishlist, compare, etc.
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
  const baseClasses = `
    relative inline-flex items-center justify-center
    touch-manipulation select-none
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    active:scale-90 active:transition-transform active:duration-100
    rounded-full
  `;

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
    minimum: `h-[38px] w-[38px]`,
    comfortable: `h-[42px] w-[42px]`,
    optimal: `h-[48px] w-[48px]`,
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
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Icon className={iconSizeClasses[size]} />
    </motion.button>
  );
};

// Mobile-optimized floating action button
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
      className={`
        ${positionClasses[position]}
        ${variantClasses[variant]}
        h-12 w-12 rounded-full
        touch-manipulation select-none
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500
        flex items-center justify-center
        ${className}
      `}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  );
};