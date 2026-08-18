import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';

import { DashboardOverview } from './DashboardOverview';
import { OrdersPage as CustomerOrdersPage } from './OrdersPage';
import { CustomerWishlistPage } from './CustomerWishlistPage';
import { AddressesPage as CustomerAddressesPage } from './AddressesPage';
import { ProfilePage as CustomerProfilePage } from './ProfilePage';

export const CustomerDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <></>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Routes>
      <Route index element={<DashboardOverview />} />
      <Route path="orders" element={<CustomerOrdersPage />} />
      <Route path="wishlist" element={<CustomerWishlistPage />} />
      <Route path="addresses" element={<CustomerAddressesPage />} />
      <Route path="profile" element={<CustomerProfilePage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default CustomerDashboard;
