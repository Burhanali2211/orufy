import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMobileAuth } from '../../hooks/useMobileAuth';
import { LogIn, LogOut, Smartphone } from 'lucide-react';

interface ResponsiveAuthButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const ResponsiveAuthButton: React.FC<ResponsiveAuthButtonProps> = ({
  variant = 'primary',
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const { user, logout } = useAuth();
  const { open } = useMobileAuth();

  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return user 
          ? 'bg-red-600 hover:bg-red-700 text-white' 
          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 text-gray-700';
      default:
        return '';
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  // Handle authentication action
  const handleAuthAction = () => {
    if (user) {
      logout();
    } else {
      // Check if we're on mobile device
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        open('login');
      } else {
        // For desktop, you might want to open a modal or redirect
      }
    }
  };

  return (
    <button
      onClick={handleAuthAction}
      className={`
        ${getVariantClasses()} 
        ${getSizeClasses()}
        ${className}
        rounded-lg font-medium transition-all duration-200 
        flex items-center justify-center gap-2
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
      `}
    >
      {showIcon && (
        <>
          {user ? (
            <LogOut className="h-4 w-4" />
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <Smartphone className="h-4 w-4 md:hidden" />
            </>
          )}
        </>
      )}
      
      <span>
        {user ? 'Sign Out' : 'Sign In'}
      </span>
    </button>
  );
};