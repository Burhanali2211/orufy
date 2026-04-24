import React from 'react';
import { IS_STOREFRONT } from '@/lib/multitenancy';
import { SaaSApp } from '@/modules/saas/SaaSApp';
import { StorefrontApp } from '@/storefront/StorefrontApp';

/**
 * Root Application Switcher
 * 
 * Determines whether to render the Orufy SaaS platform or a customer Storefront
 * based on the current hostname (domain/subdomain).
 */
const App: React.FC = () => {
  if (IS_STOREFRONT) {
    return <StorefrontApp />;
  }

  return <SaaSApp />;
};

export default App;