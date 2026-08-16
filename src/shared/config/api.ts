import { apiClient } from '../lib/apiClient';

export { apiClient };

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
    list: (params?: any) => apiClient.getProducts(params),
    get: (id: string) => apiClient.getProduct(id),
    featured: (limit?: number) => apiClient.getProducts({ featured: true, limit }),
    latest: (limit?: number) => apiClient.getProducts({ latest: true, limit }),
    homepage: (limit?: number) => apiClient.getProducts({ showOnHomepage: true, limit }),
  },

  // Categories
  categories: {
    list: () => apiClient.getCategories(),
    get: (id: string) => apiClient.getCategory(id),
  },

  // Public Settings
  settings: {
    all: () => apiClient.get('/settings'),
    public: () => apiClient.get('/settings/public'),
    social: () => apiClient.get('/settings/social'),
    contact: () => apiClient.get('/settings/contact'),
    footer: () => apiClient.get('/settings/footer'),
    hours: () => apiClient.get('/settings/hours'),
  },

  // Cart
  cart: {
    get: () => apiClient.getCart(),
    add: (productId: string, quantity: number, variantId?: string) => apiClient.addToCart(productId, quantity, variantId),
    update: (cartItemId: string, quantity: number) => apiClient.updateCartItem(cartItemId, quantity),
    remove: (cartItemId: string) => apiClient.removeFromCart(cartItemId),
  },

  // Orders
  orders: {
    list: () => apiClient.getOrders(),
    get: (orderId: string) => apiClient.getOrder(orderId),
    create: (orderData: any) => apiClient.createOrder(orderData),
  },

  // Addresses
  addresses: {
    list: () => apiClient.getAddresses(),
    create: (addressData: any) => apiClient.createAddress(addressData),
    update: (addressId: string, addressData: any) => apiClient.updateAddress(addressId, addressData),
    delete: (addressId: string) => apiClient.deleteAddress(addressId),
  },
};

export default api;
