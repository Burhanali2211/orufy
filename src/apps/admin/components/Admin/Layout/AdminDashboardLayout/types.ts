import React from 'react';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  children?: { name: string; path: string; icon: React.ElementType }[];
}

export interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}
