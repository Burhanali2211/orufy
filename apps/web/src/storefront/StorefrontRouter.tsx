import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { StorefrontLayout } from './StorefrontLayout';
import { StorefrontCartProvider } from './StorefrontCartContext';

// Dynamic imports for Storefront pages
const StorefrontHomePage = lazy(() => import('./pages/StorefrontHomePage'));
const StorefrontProductPage = lazy(() => import('./pages/StorefrontProductPage'));
const StorefrontCartPage = lazy(() => import('./pages/StorefrontCartPage'));
const StorefrontCheckoutPage = lazy(() => import('./pages/StorefrontCheckoutPage'));
const StorefrontOrderConfirmationPage = lazy(() => import('./pages/StorefrontOrderConfirmationPage'));

function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-gray-400 text-sm">Page not found.</p>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Storefront Router
 * 
 * Defines the navigation structure for individual e-commerce storefronts.
 * Isolated from the main SaaS platform routes.
 */
export function StorefrontRouter() {
  return (
    <StorefrontCartProvider>
      <StorefrontLayout>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<StorefrontHomePage />} />
            <Route path="/products/:id" element={<StorefrontProductPage />} />
            <Route path="/cart" element={<StorefrontCartPage />} />
            <Route path="/checkout" element={<StorefrontCheckoutPage />} />
            <Route path="/order-confirmation/:orderNumber" element={<StorefrontOrderConfirmationPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </StorefrontLayout>
    </StorefrontCartProvider>
  );
}
