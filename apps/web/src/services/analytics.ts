/**
 * Google Analytics 4 Service
 * Tracks user interactions, page views, and e-commerce events
 */

import ReactGA from 'react-ga4';

// Track whether GA has been successfully initialized
let gaInitialized = false;

// Initialize Google Analytics
export const initGA = (measurementId?: string) => {
  const gaId = measurementId || import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!gaId) {
    // Only warn in production - silent in development
    if (import.meta.env.PROD) {
      console.warn('Google Analytics Measurement ID not found. Analytics disabled.');
    }
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

    // Only log in development
    if (import.meta.env.DEV) {
      console.log('Google Analytics initialized:', gaId);
    }
  } catch (error) {
    // Silently fail if blocked by ad blocker in development
    if (import.meta.env.PROD) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (!gaInitialized) return;
  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to track page view:', error);
    }
  }
};

// Track custom events
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

// E-commerce tracking
export const trackEcommerce = {
  viewProduct: (product: { id: string; name: string; price: number; category?: string; brand?: string }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('view_item', { currency: 'INR', value: product.price, items: [{ item_id: product.id, item_name: product.name, item_category: product.category, item_brand: product.brand || 'Aligarh Attar House', price: product.price }] });
    } catch { /* silent */ }
  },

  addToCart: (product: { id: string; name: string; price: number; quantity: number; category?: string }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('add_to_cart', { currency: 'INR', value: product.price * product.quantity, items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price, quantity: product.quantity }] });
    } catch { /* silent */ }
  },

  removeFromCart: (product: { id: string; name: string; price: number; quantity: number }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('remove_from_cart', { currency: 'INR', value: product.price * product.quantity, items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity }] });
    } catch { /* silent */ }
  },

  beginCheckout: (cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('begin_checkout', { currency: 'INR', value: cart.total, items: cart.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })) });
    } catch { /* silent */ }
  },

  purchase: (order: { orderId: string; total: number; tax?: number; shipping?: number; items: Array<{ id: string; name: string; price: number; quantity: number; category?: string }> }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('purchase', { transaction_id: order.orderId, currency: 'INR', value: order.total, tax: order.tax || 0, shipping: order.shipping || 0, items: order.items.map(i => ({ item_id: i.id, item_name: i.name, item_category: i.category, price: i.price, quantity: i.quantity })) });
    } catch { /* silent */ }
  },

  viewCart: (cart: { items: Array<{ id: string; name: string; price: number; quantity: number }>; total: number }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('view_cart', { currency: 'INR', value: cart.total, items: cart.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })) });
    } catch { /* silent */ }
  },

  search: (searchTerm: string) => {
    if (!gaInitialized) return;
    try { ReactGA.event('search', { search_term: searchTerm }); } catch { /* silent */ }
  }
};

// User engagement tracking
export const trackUserEngagement = {
  login: (method: string = 'email') => {
    if (!gaInitialized) return;
    try { ReactGA.event('login', { method }); } catch { /* silent */ }
  },

  signUp: (method: string = 'email') => {
    if (!gaInitialized) return;
    try { ReactGA.event('sign_up', { method }); } catch { /* silent */ }
  },

  share: (contentType: string, itemId: string) => {
    if (!gaInitialized) return;
    try { ReactGA.event('share', { content_type: contentType, item_id: itemId }); } catch { /* silent */ }
  },

  addToWishlist: (product: { id: string; name: string; price: number }) => {
    if (!gaInitialized) return;
    try {
      ReactGA.event('add_to_wishlist', { currency: 'INR', value: product.price, items: [{ item_id: product.id, item_name: product.name, price: product.price }] });
    } catch { /* silent */ }
  }
};

// Set user properties
export const setUserProperties = (properties: { userId?: string; userType?: 'customer' | 'admin'; [key: string]: any }) => {
  if (!gaInitialized) return;
  try {
    if (properties.userId) ReactGA.set({ userId: properties.userId });
    ReactGA.set(properties);
  } catch { /* silent */ }
};

// Track timing
export const trackTiming = (category: string, variable: string, value: number, label?: string) => {
  if (!gaInitialized) return;
  try {
    ReactGA.event('timing_complete', { name: variable, value, event_category: category, event_label: label });
  } catch { /* silent */ }
};

