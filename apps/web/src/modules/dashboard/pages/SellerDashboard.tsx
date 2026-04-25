import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalLoader } from '@/components/Common/ProfessionalLoader';

// Import seller dashboard pages
import { SellerDashboardOverview } from '../seller/Dashboard/SellerDashboardOverview';
import { SellerProductsPage } from '../seller/Pages/SellerProductsPage';
import { SellerOrdersPage } from '../seller/Pages/SellerOrdersPage';
import { SellerAnalyticsPage } from '../seller/Pages/SellerAnalyticsPage';
import { SellerEarningsPage } from '../seller/Pages/SellerEarningsPage';
import { SellerInventoryPage } from '../seller/Pages/SellerInventoryPage';
import { SellerReviewsPage } from '../seller/Pages/SellerReviewsPage';
import { SellerReportsPage } from '../seller/Pages/SellerReportsPage';
import { SellerProfilePage } from '../seller/Pages/SellerProfilePage';
import { SellerSettingsPage } from '../seller/Pages/SellerSettingsPage';
import { DomainPage } from './DomainPage';

export const SellerDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <ProfessionalLoader
        fullPage={true}
        text="Loading seller dashboard..."
        showBrand={true}
      />
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'seller' && user.role !== 'admin' && !user.tenantId) {
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
      <Route path="domain" element={<DomainPage />} />
      <Route path="settings" element={<SellerSettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
