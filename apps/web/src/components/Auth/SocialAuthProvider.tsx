import React from 'react';
import { motion } from 'framer-motion';
import { Chrome, Facebook, Apple, Github, Twitter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

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
    color: 'bg-white border-gray-300',
    hoverColor: 'hover:bg-gray-50',
    textColor: 'text-gray-700',
    provider: 'google'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    textColor: 'text-white',
    provider: 'facebook'
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: Apple,
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    textColor: 'text-white',
    provider: 'apple'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    color: 'bg-gray-800',
    hoverColor: 'hover:bg-gray-900',
    textColor: 'text-white',
    provider: 'github'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-blue-400',
    hoverColor: 'hover:bg-blue-500',
    textColor: 'text-white',
    provider: 'twitter'
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
      showNotification({ type: 'info', title: `Redirecting to ${provider}...` });
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to authenticate with ${provider}`;
      showNotification({ type: 'error', title: errorMessage });
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
          flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-200
          ${provider.color} ${provider.hoverColor} ${provider.textColor}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${layout === 'grid' ? 'w-full' : ''}
        `}
      >
        <Icon className="h-5 w-5" />
        {showLabels && (
          <span className="font-medium">
            {layout === 'vertical' ? `Continue with ${provider.name}` : provider.name}
          </span>
        )}
      </motion.button>
    );
  };

  if (layout === 'horizontal') {
    return (
      <div className="flex flex-wrap gap-3 justify-center">
        {socialProviders.slice(0, 3).map((provider, index) => renderProvider(provider, index))}
      </div>
    );
  }

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {socialProviders.slice(0, 4).map((provider, index) => renderProvider(provider, index))}
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className="space-y-3">
      {socialProviders.slice(0, 3).map((provider, index) => renderProvider(provider, index))}
    </div>
  );
};

// OAuth callback handler component
export const AuthCallback: React.FC = () => {
  const { showNotification } = useNotification();
  const { getSession, user } = useAuth();

  React.useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (getSession) {
          const { session } = await getSession();
          if (!session) throw new Error('No session found');
        } else if (!user) {
          throw new Error('No session found');
        }
        showNotification({ type: 'success', title: 'Successfully signed in!' });
        window.location.href = '/dashboard';
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        showNotification({ type: 'error', title: errorMessage });
        window.location.href = '/';
      }
    };

    handleAuthCallback();
  }, [showNotification, getSession, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
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




