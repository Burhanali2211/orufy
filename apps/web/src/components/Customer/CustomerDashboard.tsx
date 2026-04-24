import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfessionalLoader } from '../Common/ProfessionalLoader';

// Import all customer dashboard pages
import { DashboardOverview } from './Dashboard/DashboardOverview';
import { CustomerOrdersPage } from './Orders/CustomerOrdersPage';
import { CustomerProfilePage } from './Profile/CustomerProfilePage';
import { CustomerAddressesPage } from './Addresses/CustomerAddressesPage';
import { CustomerNotificationsPage } from './Notifications/CustomerNotificationsPage';
import { CustomerPaymentsPage } from './Payments/CustomerPaymentsPage';

export const CustomerDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <ProfessionalLoader
        fullPage={true}
        text="Loading your dashboard..."
        showBrand={true}
      />
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Routes>
      <Route index element={<DashboardOverview />} />
      <Route path="orders" element={<CustomerOrdersPage />} />
      <Route path="profile" element={<CustomerProfilePage />} />
      <Route path="addresses" element={<CustomerAddressesPage />} />
      <Route path="notifications" element={<CustomerNotificationsPage />} />
      <Route path="payments" element={<CustomerPaymentsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default CustomerDashboard;

