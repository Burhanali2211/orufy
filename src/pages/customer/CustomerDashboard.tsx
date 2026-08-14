import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';


// Import all customer dashboard pages from local directory
import { DashboardOverview } from './DashboardOverview';
import { OrdersPage as CustomerOrdersPage } from './OrdersPage';
import { ProfilePage as CustomerProfilePage } from './ProfilePage';
import { AddressesPage as CustomerAddressesPage } from './AddressesPage';
import { NotificationsPage as CustomerNotificationsPage } from './NotificationsPage';
import { PaymentsPage as CustomerPaymentsPage } from './PaymentsPage';

export const CustomerDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <></>
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

