import React from 'react';
import { UsersList } from './components/Users/UsersList';
import { AdminDashboardLayout } from './layout/AdminDashboardLayout';

export const AdminUsersPage: React.FC = () => {
  return (
    <AdminDashboardLayout title="Users" subtitle="Manage user accounts">
      <UsersList />
    </AdminDashboardLayout>
  );
};

export default AdminUsersPage;
