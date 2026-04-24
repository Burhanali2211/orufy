import React from 'react';
import { StorefrontRouter } from './StorefrontRouter';

/**
 * Storefront Application Entry Point
 * 
 * This is the root component for all customer-facing storefronts.
 * It is rendered when the domain detection identifies a tenant domain.
 */
export function StorefrontApp() {
  return <StorefrontRouter />;
}
