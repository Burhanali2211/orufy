/**
 * Unified Analytics & Tracking Module
 *
 * Consolidated from:
 * - services/analytics.ts (Google Analytics 4 integration)
 * - utils/analytics.ts (Analytics utilities)
 * - hooks/usePageTracking.ts (Page tracking hook)
 */

import ReactGA from 'react-ga4';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ==================== GOOGLE ANALYTICS INITIALIZATION ====================

let gaInitialized = false;

/**
 * Initialize Google Analytics with measurement ID
 */
export const initGA = (measurementId?: string) => {
  const gaId = measurementId || import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!gaId) {
    return;
  }

  try {
    ReactGA.initialize(gaId, {
      gaOptions: {
        anonymizeIp: true, // GDPR compliance
        cookieFlags: 'SameSite=None;Secure'
      }
    });
    gaInitialized = true;
  } catch (error) {
    if (import.meta.env.PROD) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }
};

// ==================== PAGE VIEW TRACKING ====================

/**
 * Track page views
 */
export const trackPageView = (path: string, title?: string) => {
  if (!gaInitialized) return;
  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title
    });
  } catch (error) {
    // silent
  }
};

// ==================== CUSTOM EVENT TRACKING ====================

/**
 * Track custom events
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!gaInitialized) return;
  try {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
  } catch (error) {
    // silent
  }
};

// ==================== E-COMMERCE TRACKING ====================

/**
 * E-commerce tracking events
 */
export const trackEcommerce = {
  viewProduct: (product: { id: string; name: string; price: number; category?: string; brand?: string }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('view_item', {
        currency: 'INR',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand || 'AligarhAttarHouse',
          price: product.price
        }]
      });
    } catch { /* silent */ }
  },

  addToCart: (product: { id: string; name: string; price: number; quantity: number; category?: string }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('add_to_cart', {
        currency: 'INR',
        value: product.price * product.quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: product.quantity
        }]
      });
    } catch { /* silent */ }
  },

  removeFromCart: (product: { id: string; name: string; price: number; quantity: number }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('remove_from_cart', {
        currency: 'INR',
        value: product.price * product.quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity
        }]
      });
    } catch { /* silent */ }
  },

  beginCheckout: (cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('begin_checkout', {
        currency: 'INR',
        value: cart.total,
        items: cart.items.map(i => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity
        }))
      });
    } catch { /* silent */ }
  },

  purchase: (order: { orderId: string; total: number; tax?: number; shipping?: number; items: Array<{ id: string; name: string; price: number; quantity: number; category?: string }> }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('purchase', {
        transaction_id: order.orderId,
        currency: 'INR',
        value: order.total,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        items: order.items.map(i => ({
          item_id: i.id,
          item_name: i.name,
          item_category: i.category,
          price: i.price,
          quantity: i.quantity
        }))
      });
    } catch { /* silent */ }
  },

  viewCart: (cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('view_cart', {
        currency: 'INR',
        value: cart.total,
        items: cart.items.map(i => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity
        }))
      });
    } catch { /* silent */ }
  },

  search: (searchTerm: string) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('search', { search_term: searchTerm });
    } catch { /* silent */ }
  }
};

// ==================== USER ENGAGEMENT TRACKING ====================

/**
 * User engagement tracking events
 */
export const trackUserEngagement = {
  login: (method: string = 'email') => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('login', { method });
    } catch { /* silent */ }
  },

  signUp: (method: string = 'email') => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('sign_up', { method });
    } catch { /* silent */ }
  },

  share: (contentType: string, itemId: string) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('share', { content_type: contentType, item_id: itemId });
    } catch { /* silent */ }
  },

  addToWishlist: (product: { id: string; name: string; price: number }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('add_to_wishlist', {
        currency: 'INR',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price
        }]
      });
    } catch { /* silent */ }
  }
};

// ==================== USER PROPERTIES ====================

/**
 * Set user properties for segmentation and analysis
 */
export const setUserProperties = (properties: { userId?: string; userType?: 'customer' | 'admin';[key: string]: any }) => {
  if (!gaInitialized) return;
  try {
    if (properties.userId) ReactGA.set({ userId: properties.userId });
    ReactGA.set(properties);
  } catch { /* silent */ }
};

// ==================== TIMING TRACKING ====================

/**
 * Track timing metrics
 */
export const trackTiming = (category: string, variable: string, value: number, label?: string) => {
  if (!gaInitialized) return;
  try {
    ReactGA.event('timing_complete', {
      name: variable,
      value,
      event_category: category,
      event_label: label
    });
  } catch { /* silent */ }
};

// ==================== ANALYTICS UTILITIES ====================

interface UserInteractionEvent {
  type: string;
  element: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PageViewEvent {
  url: string;
  referrer: string;
  timestamp: number;
}

/**
 * Analytics utility class for detailed event collection
 */
class Analytics {
  private userInteractions: UserInteractionEvent[] = [];
  private pageViews: PageViewEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') {
      this.isEnabled = false;
      return;
    }
    this.trackPageView();
    this.setupEventListeners();
  }

  private trackPageView() {
    if (!this.isEnabled) return;
    this.pageViews.push({
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    });
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      this.recordUserInteraction('click', target.tagName, {
        id: target.id,
        class: target.className
      });
    });
    document.addEventListener('submit', (e: SubmitEvent) => {
      const target = e.target as HTMLElement;
      this.recordUserInteraction('submit', target.tagName, {
        id: target.id,
        class: target.className
      });
    });
  }

  recordUserInteraction(type: string, element: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;
    this.userInteractions.push({ type, element, timestamp: Date.now(), metadata });
  }

  getAnalytics() {
    return {
      userInteractions: this.userInteractions,
      pageViews: this.pageViews
    };
  }

  clearAnalytics() {
    this.userInteractions = [];
    this.pageViews = [];
  }
}

// Global analytics instance
export const analytics = new Analytics();

// ==================== REACT HOOKS ====================

/**
 * Hook to automatically track page views with Google Analytics
 */
export const usePageTracking = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);
};

// ==================== DEFAULT EXPORTS ====================

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackEcommerce,
  trackUserEngagement,
  setUserProperties,
  trackTiming,
  analytics,
  usePageTracking
};
