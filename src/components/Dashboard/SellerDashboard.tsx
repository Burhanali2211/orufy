import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';


// Import seller dashboard pages
import { SellerDashboardOverview } from '../Seller/Dashboard/SellerDashboardOverview';
import { SellerProductsPage } from '../Seller/Pages/SellerProductsPage';
import { SellerOrdersPage } from '../Seller/Pages/SellerOrdersPage';
import { SellerAnalyticsPage } from '../Seller/Pages/SellerAnalyticsPage';
import { SellerEarningsPage } from '../Seller/Pages/SellerEarningsPage';
import { SellerInventoryPage } from '../Seller/Pages/SellerInventoryPage';
import { SellerReviewsPage } from '../Seller/Pages/SellerReviewsPage';
import { SellerReportsPage } from '../Seller/Pages/SellerReportsPage';
import { SellerProfilePage } from '../Seller/Pages/SellerProfilePage';
import { SellerSettingsPage } from '../Seller/Pages/SellerSettingsPage';

export const SellerDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <></>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'seller' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route index element={<SellerDashboardOverview />} />
      <Route path="products/*" element={<SellerProductsPage />} />
      <Route path="orders/*" element={<SellerOrdersPage />} />
      <Route path="analytics" element={<SellerAnalyticsPage />} />
      <Route path="earnings" element={<SellerEarningsPage />} />
      <Route path="inventory" element={<SellerInventoryPage />} />
      <Route path="reviews" element={<SellerReviewsPage />} />
      <Route path="reports" element={<SellerReportsPage />} />
      <Route path="profile" element={<SellerProfilePage />} />
      <Route path="settings" element={<SellerSettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
