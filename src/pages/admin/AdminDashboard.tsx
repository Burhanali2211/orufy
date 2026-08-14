import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import { AdminDashboardHome } from './AdminDashboardHome';
import { AdminProductsPage } from './AdminProductsPage';
import { AdminCategoriesPage } from './AdminCategoriesPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AdminUsersPage } from './AdminUsersPage';
import { AdminSettingsPage } from './AdminSettingsPage';

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
      <Route path="settings/*" element={<AdminSettingsPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};
