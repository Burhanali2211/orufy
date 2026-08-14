import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'seller' | 'customer';
  allowedRoles?: ('admin' | 'seller' | 'customer')[];
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication.
 * - Checks if user is authenticated BEFORE rendering children
 * - Redirects to login if not authenticated
 * - Optionally checks for specific roles
 * - Prevents any data from being exposed before redirect
 * 
 * Usage:
 * <ProtectedRoute>
 *   <YourComponent />
 * </ProtectedRoute>
 * 
 * With role requirement:
 * <ProtectedRoute requiredRole="admin">
 *   <AdminComponent />
 * </ProtectedRoute>
 * 
 * With multiple allowed roles:
 * <ProtectedRoute allowedRoles={['admin', 'seller']}>
 *   <SellerComponent />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = '/auth'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  // This prevents any content from being rendered before auth check
  if (loading) {
    return (
      <></>
    );
  }

  // If no user is authenticated, redirect to login
  // Save the attempted location so we can redirect back after login
  if (!user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check for required role
  if (requiredRole && user.role !== requiredRole) {
    // User is authenticated but doesn't have the required role
    // Redirect to appropriate dashboard or home
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'seller') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check for allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role as 'admin' | 'seller' | 'customer')) {
      // User doesn't have any of the allowed roles
      if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // User is authenticated and has required permissions
  // Safe to render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;

