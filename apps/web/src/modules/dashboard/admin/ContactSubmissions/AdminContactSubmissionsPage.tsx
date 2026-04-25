import React from 'react';
import { ContactSubmissionsList } from './ContactSubmissionsList';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

export const AdminContactSubmissionsPage: React.FC = () => {
  return (
    <AdminDashboardLayout title="Contact Submissions" subtitle="Manage customer inquiries and messages">
      <ContactSubmissionsList />
    </AdminDashboardLayout>
  );
};

export default AdminContactSubmissionsPage;

