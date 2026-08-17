import React from 'react';
import { motion } from 'framer-motion';
import { Chrome, Facebook, Apple, Github, Twitter } from 'lucide-react';
const VITE_API_URL = import.meta.env.VITE_API_URL || '';
import { useNotification } from '@/shared/contexts/NotificationContext';

interface SocialAuthProviderProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  layout?: 'vertical' | 'horizontal' | 'grid';
  showLabels?: boolean;
}

interface SocialProvider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
  textColor: string;
  provider: 'google' | 'facebook' | 'apple' | 'github' | 'twitter';
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: Chrome,
    color: 'bg-white border-stone-200/90',
    hoverColor: 'hover:bg-stone-50 hover:border-stone-300',
    textColor: 'text-stone-800',
    provider: 'google'
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: Apple,
    color: 'bg-stone-950 border-stone-950',
    hoverColor: 'hover:bg-stone-900',
    textColor: 'text-white',
    provider: 'apple'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    color: 'bg-stone-900 border-stone-900',
    hoverColor: 'hover:bg-stone-800',
    textColor: 'text-white',
    provider: 'github'
  }
];

export const SocialAuthProvider: React.FC<SocialAuthProviderProps> = ({
  onSuccess,
  onError,
  disabled = false,
  layout = 'vertical',
  showLabels = true
}) => {
  const { showNotification } = useNotification();

  const handleSocialAuth = async (provider: SocialProvider['provider']) => {
    try {
      // Redirect to backend OAuth route — backend handles the full handshake
      window.location.href = `${VITE_API_URL}/auth/oauth/${provider}?redirect=${encodeURIComponent(window.location.origin + '/auth/callback')}`;
      showNotification({ type: 'info', title: 'Connecting', message: `Redirecting to ${provider}...` });
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to authenticate with ${provider}`;
      showNotification({ type: 'error', title: 'Authentication Failed', message: errorMessage });
      onError?.(errorMessage);
    }
  };

  const renderProvider = (provider: SocialProvider, index: number) => {
    const Icon = provider.icon;
    
    return (
      <motion.button
        key={provider.id}
        onClick={() => handleSocialAuth(provider.provider)}
        disabled={disabled}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`
          flex items-center justify-center p-3 rounded-lg border border-gray-300
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${provider.color} ${provider.hoverColor} ${provider.textColor}
          ${layout === 'grid' ? 'w-full' : 'flex-1'}
        `}
      >
        <Icon className="w-5 h-5" />
        {showLabels && (
          <span className="ml-2 text-sm font-medium">
            Continue with {provider.name}
          </span>
        )}
      </motion.button>
    );
  };

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {socialProviders.map((provider, index) => renderProvider(provider, index))}
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div className="flex space-x-3">
        {socialProviders.map((provider, index) => renderProvider(provider, index))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {socialProviders.slice(0, 3).map((provider, index) => renderProvider(provider, index))}
    </div>
  );
};

// OAuth callback handler component
export const AuthCallback: React.FC = () => {
  const { showNotification } = useNotification();

  React.useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        showNotification({ type: 'success', title: 'Welcome!', message: 'Successfully signed in!' });
        window.location.href = '/dashboard';
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        showNotification({ type: 'error', title: 'Authentication Failed', message: errorMessage });
        window.location.href = '/auth';
      }
    };

    handleAuthCallback();
  }, [showNotification]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="hidden rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Sign In</h2>
        <p className="text-gray-600">Please wait while we complete your authentication...</p>
      </div>
    </div>
  );
};

// Enhanced social auth button with provider-specific styling
interface SocialAuthButtonProps {
  provider: SocialProvider['provider'];
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
  fullWidth?: boolean;
}

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  provider,
  onClick,
  disabled = false,
  size = 'md',
  variant = 'default',
  fullWidth = false
}) => {
  const providerConfig = socialProviders.find(p => p.provider === provider);
  
  if (!providerConfig) {
    return null;
  }

  const Icon = providerConfig.icon;
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const variantClasses = {
    default: `${providerConfig.color} ${providerConfig.hoverColor} ${providerConfig.textColor} border`,
    outline: `bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50`,
    minimal: `bg-transparent text-gray-600 hover:bg-gray-100`
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        flex items-center justify-center space-x-2 rounded-lg transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Icon className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} />
      <span className="font-medium">
        {providerConfig.name}
      </span>
    </motion.button>
  );
};




