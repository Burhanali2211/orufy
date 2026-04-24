import React from 'react';
import { apiClient } from '../lib/apiClient';
import { useNotification } from '../contexts/NotificationContext';

// Hook for social auth state
export const useSocialAuth = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { showNotification } = useNotification();

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'apple' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/social', {
        provider,
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to sign in with ${provider}`;
      setError(errorMessage);
      showNotification({ type: 'error', title: 'Sign In Failed', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const linkProvider = async (provider: 'google' | 'facebook' | 'apple' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/social/link', {
        provider,
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      showNotification({ type: 'success', title: 'Account Linked', message: `Successfully linked ${provider} account` });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to link ${provider} account`;
      setError(errorMessage);
      showNotification({ type: 'error', title: 'Link Failed', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const unlinkProvider = async (provider: 'google' | 'facebook' | 'apple' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/social/unlink', { provider });

      showNotification({ type: 'success', title: 'Account Unlinked', message: `Successfully unlinked ${provider} account` });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to unlink ${provider} account`;
      setError(errorMessage);
      showNotification({ type: 'error', title: 'Unlink Failed', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signInWithProvider,
    linkProvider,
    unlinkProvider,
  };
};
