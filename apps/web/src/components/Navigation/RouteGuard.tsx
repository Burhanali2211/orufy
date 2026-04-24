import React from 'react';

// Simple route guard without enhanced navigation
interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, requiredRole, fallback }) => {
  // Simplified route guard logic - just pass through for now
  return <>{children}</>;
};