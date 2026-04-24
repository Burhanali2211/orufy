import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalLoader } from '@/components/Common/ProfessionalLoader';

// Import seller dashboard pages
import { SellerDashboardOverview } from '@/components/Seller/Dashboard/SellerDashboardOverview';
import { SellerProductsPage } from '@/components/Seller/Pages/SellerProductsPage';
import { SellerOrdersPage } from '@/components/Seller/Pages/SellerOrdersPage';
import { SellerAnalyticsPage } from '@/components/Seller/Pages/SellerAnalyticsPage';
import { SellerEarningsPage } from '@/components/Seller/Pages/SellerEarningsPage';
import { SellerInventoryPage } from '@/components/Seller/Pages/SellerInventoryPage';
import { SellerReviewsPage } from '@/components/Seller/Pages/SellerReviewsPage';
import { SellerReportsPage } from '@/components/Seller/Pages/SellerReportsPage';
import { SellerProfilePage } from '@/components/Seller/Pages/SellerProfilePage';
import { SellerSettingsPage } from '@/components/Seller/Pages/SellerSettingsPage';

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
      <Route path="settings" element={<SellerSettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
