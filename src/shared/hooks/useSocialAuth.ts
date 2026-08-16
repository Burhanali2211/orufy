import React from 'react';
import { useNotification } from '@/shared/contexts/NotificationContext';

type OAuthProvider = 'google' | 'facebook' | 'github' | 'twitter';

// Social OAuth is initiated by redirecting to the backend's OAuth route.
// The backend handles the provider handshake and sets the session cookie.
const getOAuthUrl = (provider: OAuthProvider) =>
  `${import.meta.env.VITE_API_URL || ''}/auth/oauth/${provider}?redirect=${encodeURIComponent(window.location.origin + '/auth/callback')}`;

export const useSocialAuth = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { showNotification } = useNotification();

  const signInWithProvider = async (provider: OAuthProvider) => {
    setLoading(true);
    setError(null);
    try {
      window.location.href = getOAuthUrl(provider);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to sign in with ${provider}`;
      setError(errorMessage);
      showNotification({ type: 'error', title: 'Sign In Failed', message: errorMessage });
      setLoading(false);
    }
  };

  // Link/unlink provider is a backend-only concern — exposed as stubs
  const linkProvider = async (provider: OAuthProvider) => {
    showNotification({ type: 'info', title: 'Coming Soon', message: `Linking ${provider} accounts will be available soon.` });
  };

  const unlinkProvider = async (provider: OAuthProvider) => {
    showNotification({ type: 'info', title: 'Coming Soon', message: `Unlinking ${provider} accounts will be available soon.` });
  };

  return {
    loading,
    error,
    signInWithProvider,
    linkProvider,
    unlinkProvider,
  };
};
