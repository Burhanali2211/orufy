import { supabase, db } from '../lib/legacyDb';
import { apiClient } from '../lib/apiClient';

export { supabase, db, apiClient };

// API Endpoints (for backward compatibility - not used with direct Supabase)
export const API_ENDPOINTS = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  ORDERS: '/orders',
  CART: '/cart',
  ADDRESSES: '/addresses',
  AUTH: '/auth',
  SETTINGS: '/settings',
  ADMIN: '/admin',
};

// Re-export for backward compatibility
export const api = {
  // Products
  products: {
    list: (page?: number, limit?: number) => api.products.list(page, limit),
    get: (id: string) => api.products.get(id),
    featured: (limit?: number) => api.products.featured(limit),
    latest: (limit?: number) => db.getLatestProducts(limit),
    homepage: (limit?: number) => db.getHomepageProducts(limit),
  },

  // Categories
  categories: {
    list: () => api.categories.list(),
    get: (id: string) => api.categories.get(id),
  },

  // Public Settings
  settings: {
    all: () => db.getAllPublicSettings(),
    public: () => db.getPublicSettings(),
    social: () => db.getSocialMedia(),
    contact: () => db.getContactInfo(),
    footer: () => db.getFooterLinks(),
    hours: () => db.getBusinessHours(),
  },

  // Cart
  cart: {
    get: (userId: string) => db.getCart(userId),
    add: (userId: string, productId: string, quantity: number) => db.addToCart(userId, productId, quantity),
    update: (cartItemId: string, quantity: number) => db.updateCartItem(cartItemId, quantity),
    remove: (cartItemId: string) => db.removeFromCart(cartItemId),
  },

  // Orders
  orders: {
    list: (userId: string) => db.getOrders(userId),
    get: (orderId: string) => db.getOrder(orderId),
    create: (orderData: any) => db.createOrder(orderData),
  },

  // Addresses
  addresses: {
    list: (userId: string) => db.getAddresses(userId),
    create: (addressData: any) => db.createAddress(addressData),
    update: (addressId: string, addressData: any) => db.updateAddress(addressId, addressData),
    delete: (addressId: string) => db.deleteAddress(addressId),
  },
};

export default api;
