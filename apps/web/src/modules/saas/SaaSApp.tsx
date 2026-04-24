import React from 'react';
import { SaaSRouter } from './SaaSRouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

/**
 * SaaS Platform Application Entry Point
 * 
 * This is the root component for the Orufy platform (Landing Page, Auth, Dashboard).
 * It is rendered when the domain detection identifies the main SaaS domain.
 */
export function SaaSApp() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <SettingsProvider>
          <SaaSRouter />
        </SettingsProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
