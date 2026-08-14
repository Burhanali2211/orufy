import React from 'react';
import { ContactSubmissionsList } from './components/ContactSubmissions/ContactSubmissionsList';
import { AdminDashboardLayout } from './layout/AdminDashboardLayout';

export const AdminContactSubmissionsPage: React.FC = () => {
  return (
    <AdminDashboardLayout title="Contact Submissions" subtitle="Manage customer inquiries and messages">
      <ContactSubmissionsList />
    </AdminDashboardLayout>
  );
};

export default AdminContactSubmissionsPage;

