import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CategoriesList } from './CategoriesList';
import { CategoryFormPage } from './CategoryFormPage';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

export const AdminCategoriesPage: React.FC = () => {
  return (
    <Routes>
      <Route 
        index 
        element={
          <AdminDashboardLayout title="Categories" subtitle="Organize your product categories">
            <CategoriesList />
          </AdminDashboardLayout>
        } 
      />
      <Route path="add" element={<CategoryFormPage />} />
      <Route path="edit/:id" element={<CategoryFormPage />} />
    </Routes>
  );
};

export default AdminCategoriesPage;
