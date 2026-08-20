import React, { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';


interface PublicRouteProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectIfAuthenticated = false,
  redirectTo
}) => {
  const { user, store, loading } = useAuth();

  // Only block render during the *initial* auth session check, not during
  // sign-in / sign-up operations (which also temporarily set loading=true).
  // We track whether we've seen loading=false at least once.
  const hasResolvedRef = useRef(false);
  if (!loading) hasResolvedRef.current = true;

  const isInitializing = loading && !hasResolvedRef.current;

  if (isInitializing) {
    return (
      <></>
    );
  }

  if (redirectIfAuthenticated && user) {
    const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const baseDomain = import.meta.env.VITE_SITE_URL ? new URL(import.meta.env.VITE_SITE_URL).hostname.toLowerCase() : 'get-oru.com';
    const isPlatformDomain = host === baseDomain || host === `www.${baseDomain}` || host === 'localhost' || host === '127.0.0.1';

    if (isPlatformDomain && user.role === 'customer') {
      if (store?.hostname && store.hostname !== baseDomain && store.hostname !== `www.${baseDomain}`) {
        window.location.href = `https://${store.hostname}/dashboard`;
        return null;
      }
      return <Navigate to="/" replace />;
    }

    const destination = redirectTo || (user.role === 'admin' || user.role === 'merchant' ? '/admin' : '/dashboard');
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
