import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalLoader } from '@/components/Common/ProfessionalLoader';
import { AdminDashboardHome } from '../admin/Dashboard/AdminDashboardHome';
import { AdminProductsPage } from '../admin/Products/AdminProductsPage';
import { AdminCategoriesPage } from '../admin/Categories/AdminCategoriesPage';
import { AdminOrdersPage } from '../admin/Orders/AdminOrdersPage';
import { AdminUsersPage } from '../admin/Users/AdminUsersPage';
import { AdminAnalyticsPage } from '../admin/Analytics/AdminAnalyticsPage';
import { AdminSettingsPage } from '../admin/Settings/AdminSettingsPage';
import { AdminContactSubmissionsPage } from '../admin/ContactSubmissions/AdminContactSubmissionsPage';
import { AdminInventoryPage } from '../admin/Products/AdminInventoryPage';
import { AdminPOSPage } from '../admin/Orders/AdminPOSPage';

export const AdminDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <ProfessionalLoader
        fullPage={true}
        text="Loading admin dashboard..."
        showBrand={true}
      />
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route index element={<AdminDashboardHome />} />
      <Route path="products/*" element={<AdminProductsPage />} />
      <Route path="categories/*" element={<AdminCategoriesPage />} />
      <Route path="orders/*" element={<AdminOrdersPage />} />
      <Route path="users/*" element={<AdminUsersPage />} />
      <Route path="analytics" element={<AdminAnalyticsPage />} />
      <Route path="inventory" element={<AdminInventoryPage />} />
      <Route path="pos" element={<AdminPOSPage />} />
      <Route path="contact-submissions/*" element={<AdminContactSubmissionsPage />} />
      <Route path="settings/*" element={<AdminSettingsPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};
