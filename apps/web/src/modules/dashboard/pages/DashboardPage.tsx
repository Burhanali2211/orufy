import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { CustomerDashboard } from '@/components/Customer/CustomerDashboard';
import { SellerDashboard } from './SellerDashboard';
import { ProfessionalLoader } from '@/components/Common/ProfessionalLoader';

export const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    // If on admin route and not authenticated, redirect to admin login
    if (!loading && !user && isAdminRoute) {
      navigate('/admin/login', { replace: true });
    }
  }, [user, loading, isAdminRoute, navigate]);

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ProfessionalLoader fullPage={false} text="Loading dashboard..." />
      </div>
    );
  }

  // Show access denied if no user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    const userRole = user.role;

    // Shop owners who went through onboarding have a tenantId — always send them to SellerDashboard
    if (user.tenantId || userRole === 'seller') {
      return <SellerDashboard />;
    }

    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}
    </div>
  );
};

export default DashboardPage;