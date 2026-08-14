import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { AdminDashboardHome } from '../Admin/Dashboard/AdminDashboardHome';
import { AdminProductsPage } from '../Admin/Products/AdminProductsPage';
import { AdminCategoriesPage } from '../Admin/Categories/AdminCategoriesPage';
import { AdminOrdersPage } from '../Admin/Orders/AdminOrdersPage';
import { AdminUsersPage } from '../Admin/Users/AdminUsersPage';
import { AdminAnalyticsPage } from '../Admin/Analytics/AdminAnalyticsPage';
import { AdminSettingsPage } from '../Admin/Settings/AdminSettingsPage';
import { AdminContactSubmissionsPage } from '../Admin/ContactSubmissions/AdminContactSubmissionsPage';
import { AdminInventoryPage } from '../Admin/Products/AdminInventoryPage';
import { AdminPOSPage } from '../Admin/Orders/AdminPOSPage';

export const AdminDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <></>
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
