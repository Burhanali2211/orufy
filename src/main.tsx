// StrictMode removed: it causes React 18 double-mount which orphans the
// Supabase GoTrue auth lock (mount → unmount before lock release → 5s timeout
// on remount). All other StrictMode checks are caught by TypeScript + ESLint.
import { Fragment as StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

// Initialize analytics and error tracking
import { initGA } from './services/analytics';
import { initSentry, ErrorBoundary } from './services/errorTracking';

// Initialize Sentry (error tracking)
initSentry();

// Initialize Google Analytics
initGA();

// Initialize Service Worker management (unregister existing workers to prevent caching issues)
import { initServiceWorker } from './utils/serviceWorker';
initServiceWorker().catch(error => {
  console.warn('[SW] Failed to initialize Service Worker management:', error);
});

// Initialize admin dashboard styles from cache immediately (prevents flash of old colors)
if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
  import('./utils/adminDashboardStyles').then(({ initializeDashboardStyles }) => {
    initializeDashboardStyles();
  });
}

// Global error handler to suppress browser extension errors
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const errorMessage = error?.message || String(error) || '';
    const errorStack = error?.stack || '';
    const errorString = String(error);
    
    // Handle chunk/module load errors (stale deployment: new deploy = new hash = old URL 404s)
    // These must NOT be suppressed — they need a page reload to pick up fresh assets
    const isChunkLoadError =
      errorMessage.includes('error loading dynamically imported module') ||
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Importing a module script failed') ||
      errorString.includes('error loading dynamically imported module') ||
      errorString.includes('Failed to fetch dynamically imported module');

    if (isChunkLoadError) {
      event.preventDefault();
      // Reload once (with a 30-second cooldown) to pick up new deployment assets
      const RELOAD_KEY = 'chunkLoadReload';
      const last = sessionStorage.getItem(RELOAD_KEY);
      if (!last || Date.now() - parseInt(last, 10) > 30000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
      return;
    }

    // Check if error is from a browser extension or known non-critical sources
    const isExtensionError =
      errorMessage.includes('moz-extension://') ||
      errorMessage.includes('chrome-extension://') ||
      errorMessage.includes('safari-extension://') ||
      errorStack.includes('moz-extension://') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('safari-extension://') ||
      errorString.includes('appConfig.js') ||
      errorMessage.includes('appConfig.js') ||
      errorStack.includes('appConfig.js') ||
      errorMessage.includes('XrayWrapper') ||
      errorStack.includes('XrayWrapper') ||
      (errorMessage.includes('newValue') && (errorMessage.includes('undefined') || errorMessage.includes('can\'t access'))) ||
      (errorString.includes('newValue') && (errorString.includes('undefined') || errorString.includes('can\'t access'))) ||
      (errorMessage.includes('can\'t access property') && errorMessage.includes('newValue')) ||
      errorMessage.includes('NS_ERROR_CORRUPTED_CONTENT') ||
      errorMessage.includes('NS_BINDING_ABORTED') ||
      errorMessage.includes('ServiceWorker intercepted') ||
      errorMessage.includes('ServiceWorker') ||
      errorMessage.includes('sw.js') ||
      errorString.includes('NS_BINDING_ABORTED') ||
      errorString.includes('ServiceWorker intercepted') ||
      errorString.includes('sw.js') ||
      errorStack.includes('sw.js');

    if (isExtensionError) {
      // Prevent extension errors from breaking the app
      event.preventDefault();
      if (process.env.NODE_ENV === 'development') {
        console.debug('Suppressed browser extension/non-critical error:', errorMessage || errorString);
      }
      return;
    }
  });

  // Handle general errors from extensions
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = String(message);
    const errorSource = String(source || '');
    
    // Handle chunk/module load errors with a reload (same logic as unhandledrejection handler)
    const isChunkLoadError =
      errorMessage.includes('error loading dynamically imported module') ||
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Importing a module script failed');

    if (isChunkLoadError) {
      const RELOAD_KEY = 'chunkLoadReload';
      const last = sessionStorage.getItem(RELOAD_KEY);
      if (!last || Date.now() - parseInt(last, 10) > 30000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
      return true;
    }

    // Check if error is from a browser extension or known non-critical sources
    const isExtensionError =
      errorSource.includes('moz-extension://') ||
      errorSource.includes('chrome-extension://') ||
      errorSource.includes('safari-extension://') ||
      errorSource.includes('appConfig.js') ||
      errorSource.includes('XrayWrapper') ||
      errorMessage.includes('appConfig.js') ||
      errorMessage.includes('XrayWrapper') ||
      errorMessage.includes('NS_ERROR_CORRUPTED_CONTENT') ||
      errorMessage.includes('NS_BINDING_ABORTED') ||
      errorMessage.includes('ServiceWorker intercepted') ||
      errorMessage.includes('ServiceWorker') ||
      errorMessage.includes('sw.js') ||
      (errorMessage.includes('newValue') && (errorMessage.includes('undefined') || errorMessage.includes('can\'t access'))) ||
      (errorMessage.includes('can\'t access property') && errorMessage.includes('newValue'));

    if (isExtensionError) {
      // Suppress extension errors
      if (process.env.NODE_ENV === 'development') {
        console.debug('Suppressed browser extension/non-critical error:', errorMessage);
      }
      return true; // Prevent default error handling
    }
    
    // Call original error handler for non-extension errors
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    
    return false;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>{error instanceof Error ? error.message : String(error)}</p>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
      showDialog={false}
    >
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
