import React from 'react';
import { UsersList } from './UsersList';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

export const AdminUsersPage: React.FC = () => {
  return (
    <AdminDashboardLayout title="Users" subtitle="Manage user accounts">
      <UsersList />
    </AdminDashboardLayout>
  );
};

export default AdminUsersPage;
