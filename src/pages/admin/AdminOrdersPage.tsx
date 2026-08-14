import React from 'react';
import { OrdersList } from './components/Orders/OrdersList';
import { AdminDashboardLayout } from './layout/AdminDashboardLayout';

export const AdminOrdersPage: React.FC = () => {
  return (
    <AdminDashboardLayout title="Orders" subtitle="Manage customer orders">
      <OrdersList />
    </AdminDashboardLayout>
  );
};

export default AdminOrdersPage;
