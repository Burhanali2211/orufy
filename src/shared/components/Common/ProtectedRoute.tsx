import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'seller' | 'merchant' | 'customer';
  allowedRoles?: ('admin' | 'seller' | 'merchant' | 'customer')[];
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
  const { user, loading, store } = useAuth();
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

  // Check host domain context
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const baseDomain = import.meta.env.VITE_SITE_URL ? new URL(import.meta.env.VITE_SITE_URL).hostname.toLowerCase() : 'get-oru.com';
  const isPlatformDomain = host === baseDomain || host === `www.${baseDomain}` || host === 'localhost' || host === '127.0.0.1';

  // If a customer account attempts to access dashboard on the platform root domain, transfer them to their actual store domain
  if (isPlatformDomain && user.role === 'customer' && location.pathname.startsWith('/dashboard')) {
    if (store?.hostname && store.hostname !== baseDomain && store.hostname !== `www.${baseDomain}`) {
      window.location.href = `https://${store.hostname}/dashboard`;
      return null;
    }
    return <Navigate to="/" replace />;
  }

  // Allow admins, merchants, and sellers to access admin routes
  const isMerchantOrAdmin = user.role === 'admin' || user.role === 'merchant' || user.role === 'seller';
  const isAccessingAdmin = location.pathname.startsWith('/admin');

  if (isMerchantOrAdmin && isAccessingAdmin) {
    return <>{children}</>;
  }

  // Check for required role
  if (requiredRole && user.role !== requiredRole) {
    if (isMerchantOrAdmin) {
      return <>{children}</>;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check for allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role as any)) {
      if (isMerchantOrAdmin) {
        return <>{children}</>;
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
