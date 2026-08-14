/**
 * Auth Guard Hook
 * Monitors auth state and redirects to login if session becomes invalid
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/legacyDb';

export function useAuthGuard(redirectTo = '/auth') {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // If session lost while we have a user, redirect
      if (!session && user) {
        console.warn('[AUTH-GUARD] Session lost. Redirecting to login.');
        navigate(redirectTo, { replace: true });
      }

      // If token refresh failed repeatedly, session is null but we thought we were logged in
      if (event === 'SIGNED_OUT' && user) {
        console.warn('[AUTH-GUARD] Sign out detected. Redirecting to login.');
        navigate(redirectTo, { replace: true });
      }
    });

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, [user, navigate, redirectTo]);
}

/**
 * Higher-order component wrapper for auth guard
 * Use on protected pages to auto-redirect if session dies
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
): React.FC<P> {
  return ((props: P) => {
    useAuthGuard(redirectTo);
    return React.createElement(Component, props);
  }) as React.FC<P>;
}
