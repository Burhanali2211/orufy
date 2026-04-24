import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalLoader } from './ProfessionalLoader';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'admin' | 'seller' | 'customer';
  allowedRoles?: ('admin' | 'seller' | 'customer')[];
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication.
 * - Uses useAuth() from AuthContext
 * - If loading: show ProfessionalLoader
 * - If no user: redirect to /login with state={{ from: location }}
 * - If user exists: render children (or Outlet)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = '/login'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <ProfessionalLoader
        fullPage={true}
        text="Verifying access..."
        showBrand={true}
      />
    );
  }

  if (!user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role as any)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
