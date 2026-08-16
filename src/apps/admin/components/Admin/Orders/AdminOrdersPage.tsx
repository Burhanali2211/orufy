import React from 'react';
import { OrdersList } from './OrdersList';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

export const AdminOrdersPage: React.FC = () => {
  return (
    <AdminDashboardLayout title="Orders" subtitle="Manage customer orders">
      <OrdersList />
    </AdminDashboardLayout>
  );
};

export default AdminOrdersPage;
