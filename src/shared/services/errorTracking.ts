/**
 * Sentry Error Tracking Service
 * Captures and reports errors, performance issues, and user feedback
 */

import * as Sentry from '@sentry/react';

// Initialize Sentry
export const initSentry = (dsn?: string) => {
  const sentryDsn = dsn || import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    // Silently return - Sentry is optional and not required for app functionality
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE || 'development',

      // Performance Monitoring and Session Replay
      integrations: [
        // BrowserTracing and Replay are automatically included in @sentry/react
        // No need to manually add them
      ],

      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

      // Set sample rate for error events
      sampleRate: 1.0,

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Don't send events in development
        if (import.meta.env.MODE === 'development') {
          console.log('Sentry event (dev mode):', event);
          return null;
        }
        
        // Filter out specific errors
        if (event.exception) {
          const error = hint.originalException;
          
          // Ignore network errors (they're usually temporary)
          if (error instanceof Error && error.message.includes('NetworkError')) {
            return null;
          }
          
          // Ignore browser extension errors
          if (error instanceof Error && error.message.includes('extension')) {
            return null;
          }
        }
        
        return event;
      },
      
      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        // Random plugins/extensions
        'atomicFindClose',
        'conduitPage',
      ],
      
      // Deny URLs (don't track errors from these sources)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    console.log('Sentry initialized:', sentryDsn.substring(0, 20) + '...');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

// Capture exception
export const captureException = (
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) => {
  try {
    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      
      if (context?.level) {
        scope.setLevel(context.level);
      }
      
      Sentry.captureException(error);
    });
  } catch (err) {
    console.error('Failed to capture exception:', err);
  }
};

// Capture message
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) => {
  try {
    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  } catch (error) {
    console.error('Failed to capture message:', error);
  }
};

// Set user context
export const setUser = (user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
} | null) => {
  try {
    Sentry.setUser(user);
  } catch (error) {
    console.error('Failed to set user:', error);
  }
};

// Add breadcrumb
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) => {
  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch (error) {
    console.error('Failed to add breadcrumb:', error);
  }
};

// Track performance
export const trackPerformance = {
  // Start a transaction
  startTransaction: (name: string, op: string) => {
    try {
      // Transactions are handled automatically by Sentry
      // This is a no-op for compatibility
      return { finish: () => {} };
    } catch (error) {
      console.error('Failed to start transaction:', error);
      return null;
    }
  },

  // Measure function execution time
  measure: async <T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> => {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      // Log performance metric
      if (tags) {
        Sentry.captureMessage(`${name} completed in ${duration}ms`, 'info');
      }

      return result;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  },
};

// E-commerce error tracking
export const trackEcommerceError = {
  // Payment error
  paymentError: (error: Error, orderId?: string, amount?: number) => {
    captureException(error, {
      tags: {
        error_type: 'payment',
        order_id: orderId || 'unknown',
      },
      extra: {
        amount,
        timestamp: new Date().toISOString(),
      },
      level: 'error',
    });
  },
  
  // Checkout error
  checkoutError: (error: Error, step: string) => {
    captureException(error, {
      tags: {
        error_type: 'checkout',
        checkout_step: step,
      },
      level: 'error',
    });
  },
  
  // API error
  apiError: (error: Error, endpoint: string, method: string) => {
    captureException(error, {
      tags: {
        error_type: 'api',
        endpoint,
        method,
      },
      level: 'error',
    });
  },
  
  // Product error
  productError: (error: Error, productId: string) => {
    captureException(error, {
      tags: {
        error_type: 'product',
        product_id: productId,
      },
      level: 'warning',
    });
  },
};

// Create error boundary
export const ErrorBoundary = Sentry.ErrorBoundary;

// Export Sentry for advanced usage
export { Sentry };

