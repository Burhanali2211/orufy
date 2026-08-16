import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';

import { AdminDashboardHome } from '@/apps/admin/components/Admin/Dashboard/AdminDashboardHome';
import { AdminProductsPage } from '@/apps/admin/components/Admin/Products/AdminProductsPage';
import { AdminCategoriesPage } from '@/apps/admin/components/Admin/Categories/AdminCategoriesPage';
import { AdminOrdersPage } from '@/apps/admin/components/Admin/Orders/AdminOrdersPage';
import { AdminUsersPage } from '@/apps/admin/components/Admin/Users/AdminUsersPage';
import { AdminSettingsPage } from '@/apps/admin/components/Admin/Settings/AdminSettingsPage';

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
