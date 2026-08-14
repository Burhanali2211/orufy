import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProductsList } from './ProductsList';
import { ProductFormPage } from './ProductFormPage';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

export const AdminProductsPage: React.FC = () => {
  return (
    <Routes>
      <Route 
        index 
        element={
          <AdminDashboardLayout title="Products" subtitle="Manage your product catalog">
            <ProductsList />
          </AdminDashboardLayout>
        } 
      />
      <Route path="add" element={<ProductFormPage />} />
      <Route path="edit/:id" element={<ProductFormPage />} />
    </Routes>
  );
};

export default AdminProductsPage;
