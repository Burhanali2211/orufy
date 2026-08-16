/**
 * Auth Guard Hook
 * Monitors auth state and redirects to login if user session is lost.
 * Uses AuthContext — no supabase dependency.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';

export function useAuthGuard(redirectTo = '/auth') {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.warn('[AUTH-GUARD] No user session. Redirecting to login.');
      navigate(redirectTo, { replace: true });
    }
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
