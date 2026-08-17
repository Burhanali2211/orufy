import React, { Suspense, useEffect, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './shared/styles/pwa-responsive.css';
import { CombinedProvider } from '@/shared/contexts/CombinedProvider';
import { Layout } from '@/shared/components/Layout/Layout';
import { ErrorBoundary } from '@/shared/components/Common/ErrorBoundary';
import { ScrollToTop } from '@/shared/components/Common/ScrollToTop';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/react-router';

import { CommandPalette } from '@/shared/components/Navigation/CommandPalette';

import { GlobalMediaErrorHandler } from '@/shared/components/Common/MediaErrorHandler';

import { usePageTracking } from '@/shared/hooks/usePageTracking';
import { ProtectedRoute } from '@/shared/components/Common/ProtectedRoute';
import { PublicRoute } from '@/shared/components/Common/PublicRoute';

// Lazy-loaded pages for code splitting - optimized for performance
const HomePage = React.lazy(() => import('@/apps/storefront/pages/HomePage'));
const ProductsPage = React.lazy(() => import('@/apps/storefront/pages/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('@/apps/storefront/pages/ProductDetailPage'));
const SearchPage = React.lazy(() => import('@/apps/storefront/pages/SearchPage'));
const CartPage = React.lazy(() => import('@/apps/storefront/pages/CartPage'));
const WishlistPage = React.lazy(() => import('@/apps/storefront/pages/WishlistPage'));
const ComparePage = React.lazy(() => import('@/apps/storefront/pages/ComparePage'));
const NewArrivalsPage = React.lazy(() => import('@/apps/storefront/pages/NewArrivalsPage'));
const DealsPage = React.lazy(() => import('@/apps/storefront/pages/DealsPage'));
const AuthPage = React.lazy(() => import('@/apps/storefront/pages/AuthPage'));
const ResetPasswordPage = React.lazy(() => import('@/apps/storefront/pages/ResetPasswordPage'));
const NotFoundPage = React.lazy(() => import('@/apps/storefront/pages/NotFoundPage'));
const CategoriesPage = React.lazy(() => import('@/apps/storefront/pages/CategoriesPage'));
const AuthCallbackPage = React.lazy(() => import('@/apps/storefront/pages/AuthCallbackPage'));
const AboutPage = React.lazy(() => import('@/apps/storefront/pages/AboutPage')); // Added About page
const ContactPage = React.lazy(() => import('@/apps/storefront/pages/ContactPage')); // Added Contact page
const OnboardingPage = React.lazy(() => import('@/apps/platform/pages/Onboarding/OnboardingPage'));
const PlatformLandingPage = React.lazy(() => import('@/apps/platform/pages/PlatformLandingPage'));

// Legal pages
const PrivacyPolicyPage = React.lazy(() => import('@/apps/storefront/pages/PrivacyPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('@/apps/storefront/pages/TermsOfServicePage'));
const RefundPolicyPage = React.lazy(() => import('@/apps/storefront/pages/RefundPolicyPage'));
const ShippingPolicyPage = React.lazy(() => import('@/apps/storefront/pages/ShippingPolicyPage'));

// Heavy admin/dashboard pages - loaded only when needed
const AdminDashboard = React.lazy(() => import('@/apps/admin/pages/AdminDashboard'));
const CustomerDashboard = React.lazy(() => import('@/apps/customer/pages/CustomerDashboard'));
const CheckoutPage = React.lazy(() => import('@/apps/storefront/pages/CheckoutPage'));
const OrderTrackingPage = React.lazy(() => import('@/apps/storefront/pages/OrderTrackingPage'));
const OrderConfirmationPage = React.lazy(() => import('@/apps/storefront/pages/OrderConfirmationPage'));
const ProfileRedirect = React.lazy(() =>
  import('@/shared/components/Common/ProfileRedirect').then(module => ({ default: module.ProfileRedirect }))
);



// Universal optimized loading fallback component
const PageLoadingFallback = memo(() => (
  <></>
));

PageLoadingFallback.displayName = 'PageLoadingFallback';

// Component to track page views
const PageTracker = () => {
  usePageTracking();
  return null;
};

function App() {
  // Unregister any Service Workers on mount to prevent caching issues
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister().catch(() => {
            // Ignore errors during unregistration
          });
        });
      }).catch(() => {
        // Ignore errors
      });
    }
  }, []);

  // Handle media errors globally
  useEffect(() => {
    const handleMediaError = (e: Event) => {
      const target = e.target as HTMLMediaElement;
      // Prevent the error from propagating
      e.stopImmediatePropagation();
    };

    // Add event listeners for media elements
    document.addEventListener('error', handleMediaError, true);

    return () => {
      document.removeEventListener('error', handleMediaError, true);
    };
  }, []);

  // Handle dynamic import errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      const errorSource = event.filename || '';

      // Chunk load errors = stale deployment. Auto-reload once to get fresh assets.
      if (
        errorMessage.includes('error loading dynamically imported module') ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed')
      ) {
        event.preventDefault();
        const RELOAD_KEY = 'chunkLoadReload';
        const last = sessionStorage.getItem(RELOAD_KEY);
        if (!last || Date.now() - parseInt(last, 10) > 30000) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
        }
        return true;
      }

      // Suppress only ServiceWorker-related non-critical errors
      if (
        errorMessage.includes('ServiceWorker intercepted') ||
        errorSource.includes('sw.js')
      ) {
        event.preventDefault();
        return true;
      }
      return false;
    };

    window.addEventListener('error', handleError, true);
    return () => {
      window.removeEventListener('error', handleError, true);
    };
  }, []);




  return (
    <ErrorBoundary>
      <CombinedProvider>
        <Router>
          <NuqsAdapter>
            <Toaster position="top-right" richColors closeButton />
            <CommandPalette />
            <PageTracker />
            <GlobalMediaErrorHandler />
            <ScrollToTop />
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
              {/* Admin routes - Protected, requires admin role, NO Layout wrapper (has its own AdminLayout) */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Onboarding - Platform Level, requires authentication but NOT admin role */}
              <Route 
                path="/onboarding" 
                element={<OnboardingPage />} 
              />

              {/* Platform Landing Page - Root, NO Layout wrapper */}
              <Route 
                path="/" 
                element={
                  // If we are on a subdomain (e.g. shop.get-oru.com) or custom domain, redirect / to /store
                  // If we are on the base domain (get-oru.com) or localhost without a subdomain, show the platform landing page
                  (() => {
                    const host = typeof window !== 'undefined' ? window.location.hostname : '';
                    const baseDomain = import.meta.env.VITE_SITE_URL ? new URL(import.meta.env.VITE_SITE_URL).hostname : 'get-oru.com';
                    const isSubdomain = host !== baseDomain && host !== 'localhost' && host !== '127.0.0.1';
                    
                    return isSubdomain ? <Navigate to="/store" replace /> : <PlatformLandingPage />;
                  })()
                } 
              />

              {/* Regular routes - WITH Layout wrapper */}
              <Route path="/*" element={
                <Layout>
                  <main id="main-content" className="focus:outline-none">
                    <Routes>
                      {/* Public routes - No authentication required */}
                      <Route path="/store" element={<HomePage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/compare" element={<ComparePage />} />
                      <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                      <Route path="/deals" element={<DealsPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/categories/:slug" element={<ProductsPage />} />
                      <Route path="/collections" element={<Navigate to="/products" replace />} />
                      <Route path="/collections/:slug" element={<ProductsPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      
                      {/* Legal pages - Public */}
                      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                      <Route path="/refund-policy" element={<RefundPolicyPage />} />
                      <Route path="/shipping-policy" element={<ShippingPolicyPage />} />

                      {/* Auth page - Redirect if already authenticated */}
                      <Route
                        path="/auth"
                        element={
                          <PublicRoute redirectIfAuthenticated={true}>
                            <AuthPage />
                          </PublicRoute>
                        }
                      />

                      {/* Password reset - accessible without auth (user arrives from email link) */}
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />

                      {/* Protected routes - Require authentication */}
                      <Route 
                        path="/dashboard/*" 
                        element={
                          <ProtectedRoute>
                            <CustomerDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/wishlist" 
                        element={
                          <ProtectedRoute>
                            <WishlistPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/checkout" 
                        element={
                          <ProtectedRoute>
                            <CheckoutPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route
                        path="/order-confirmation/:orderId"
                        element={
                          <ProtectedRoute>
                            <OrderConfirmationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/track-order/:orderId"
                        element={
                          <ProtectedRoute>
                            <OrderTrackingPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/orders/:orderId" 
                        element={
                          <ProtectedRoute>
                            <OrderTrackingPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute>
                            <ProfileRedirect />
                          </ProtectedRoute>
                        } 
                      />

                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                </Layout>
              } />
            </Routes>
          </Suspense>
        </NuqsAdapter>
      </Router>
    </CombinedProvider>
    </ErrorBoundary>
  );
}

export default App;