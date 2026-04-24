import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfessionalLoader } from './ProfessionalLoader';

/**
 * ProfileRedirect component handles routing to profile page based on user role
 * - Customers: Redirect to /dashboard/profile
 * - Sellers: Redirect to /dashboard/profile (seller dashboard)
 * - Admins: Redirect to /admin (no profile page for admins)
 * - Unauthenticated: Redirect to /auth
 */
export const ProfileRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <ProfessionalLoader
        fullPage={true}
        text="Loading..."
        showBrand={true}
      />
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin users don't have a profile page - redirect to admin dashboard
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Customers and sellers both have profile at /dashboard/profile
  // The DashboardPage component will route to the correct dashboard based on role
  return <Navigate to="/dashboard/profile" replace />;
};

