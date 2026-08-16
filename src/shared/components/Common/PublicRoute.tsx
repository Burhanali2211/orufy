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
  const { user, loading } = useAuth();

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
    const destination = redirectTo || (user.role === 'admin' ? '/admin' : '/dashboard');
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
