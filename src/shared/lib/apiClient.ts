/**
 * API Client for communicating with the backend
 * Replaces Supabase client with direct API calls
 * 
 * In development, uses relative paths to leverage Vite proxy (no CORS preflight)
 * In production, uses environment variable or default API path
 */

const getApiBaseUrl = (): string => {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production, use environment variable or default to /api
  return import.meta.env.VITE_API_URL || '/api';
};

const API_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: {
    status: number;
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private token: string | null = null;
  private storeHostname: string | null = null;

  constructor() {
    // Initialize token from localStorage on startup
    this.token = localStorage.getItem('auth_token');
    this.storeHostname = localStorage.getItem('store_hostname');
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    // Always check localStorage in case it was updated by another tab
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      this.token = storedToken;
    }
    return this.token;
  }

  /**
   * Set store hostname
   */
  setStoreHostname(hostname: string | null) {
    this.storeHostname = hostname;
    if (hostname) {
      localStorage.setItem('store_hostname', hostname);
    } else {
      localStorage.removeItem('store_hostname');
    }
  }

  /**
   * Get store hostname
   */
  getStoreHostname(): string | null {
    const stored = localStorage.getItem('store_hostname');
    if (stored) {
      this.storeHostname = stored;
    }
    
    // If we still don't have a store hostname, and we're in the browser, 
    // infer it from the URL if we are NOT on a platform apex domain (localhost/get-oru.com)
    if (!this.storeHostname && typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isPlatformHost = host === 'localhost' || host === '127.0.0.1' || host === 'get-oru.com' || host === 'www.get-oru.com';
      
      if (!isPlatformHost) {
        this.storeHostname = host;
      }
    }
    
    return this.storeHostname;
  }

  /**
   * Make API request
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Add store hostname if available for platform admin requests
    const storeHostname = this.getStoreHostname();
    if (storeHostname) {
      (headers as Record<string, string>)['x-store-hostname'] = storeHostname;
    }

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Invalid JSON response from server');
        }
      } else {
        // If not JSON, get text
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { message: text };
          }
        }
      }

      if (!response.ok) {
        const errorMessage = data?.error?.message || data?.message || `API request failed with status ${response.status}`;
        const error: any = new Error(errorMessage);
        error.status = response.status;
        error.response = { status: response.status, data };
        
        // Handle 401 Unauthorized immediately
        if (response.status === 401) {
          this.setToken(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          
          // Only redirect if not already on auth page
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
            window.location.href = '/auth';
          }
        }
        
        throw error;
      }

      return data;
    } catch (error: any) {
      // Check if it's a 401 error from the response
      const is401Error = error?.status === 401 || error?.response?.status === 401;
      
      // If 401 was already handled above, just rethrow
      if (is401Error && !this.getToken()) {
        throw new Error('Session expired. Please log in again.');
      }

      // Handle network errors or other fetch errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`Network Error [${endpoint}]:`, error);
        throw new Error('Network error. Please check your connection.');
      }

      // Silently handle expected 401 errors for /auth/me when no token exists
      const isAuthMeEndpoint = endpoint === '/auth/me';
      const hasNoToken = !this.getToken();

      if (isAuthMeEndpoint && is401Error && hasNoToken) {
        // Expected behavior - user is not logged in, don't log error
        throw error;
      }

      // Log all other errors
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body: any): Promise<T> {
    // Log the body being sent for debugging
    if (process.env.NODE_ENV === 'development' || endpoint.includes('/auth')) {
      console.log('API POST Request:', {
        endpoint,
        bodyKeys: Object.keys(body || {}),
        hasEmail: !!body?.email,
        hasPassword: !!body?.password,
        bodyType: typeof body
      });
    }
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Upload request (multipart/form-data)
   */
  async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {};

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Add store hostname if available for platform admin requests
    const storeHostname = this.getStoreHostname();
    if (storeHostname) {
      (headers as Record<string, string>)['x-store-hostname'] = storeHostname;
    }

    // Notice we do NOT set Content-Type so the browser sets it to multipart/form-data with boundaries

    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ==========================================
  // Authentication
  // ==========================================

  async register(email: string, password: string, fullName: string, role: string = 'customer') {
    // Validate inputs before sending
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Email is required');
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      throw new Error('Password is required');
    }
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      throw new Error('Full name is required');
    }

    const response = await this.post('/auth/register', {
      email: email.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      role
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(email: string, password: string) {
    // Validate inputs before sending
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Email is required');
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      throw new Error('Password is required');
    }

    const response = await this.post('/auth/login', { 
      email: email.trim(), 
      password: password.trim() 
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async updateProfile(data: any) {
    return this.put('/auth/profile', data);
  }

  // ==========================================
  // Products
  // ==========================================

  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    featured?: boolean;
    bestSellers?: boolean;
    latest?: boolean;
    sellerId?: string;
    showOnHomepage?: boolean;
  }): Promise<PaginatedResponse<any>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.search) query.append('search', params.search);
    if (params?.featured) query.append('featured', 'true');
    if (params?.bestSellers) query.append('bestSellers', 'true');
    if (params?.latest) query.append('latest', 'true');
    if (params?.sellerId) query.append('sellerId', params.sellerId);
    if (params?.showOnHomepage) query.append('showOnHomepage', 'true');

    const queryString = query.toString();
    return this.get(`/products${queryString ? '?' + queryString : ''}`);
  }

  async getProduct(id: string) {
    return this.get(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.post('/products', data);
  }

  async updateProduct(id: string, data: any) {
    return this.put(`/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.delete(`/products/${id}`);
  }

  // ==========================================
  // Categories
  // ==========================================

  async getCategories() {
    return this.get('/categories');
  }

  async getCategory(id: string) {
    return this.get(`/categories/${id}`);
  }

  async createCategory(data: any) {
    return this.post('/categories', data);
  }

  async updateCategory(id: string, data: any) {
    return this.put(`/categories/${id}`, data);
  }

  async deleteCategory(id: string) {
    return this.delete(`/categories/${id}`);
  }

  // ==========================================
  // Cart
  // ==========================================

  async getCart() {
    return this.get('/cart');
  }

  async addToCart(productId: string, quantity: number, variantId?: string) {
    return this.post('/cart', { productId, quantity, variantId });
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.put(`/cart/${itemId}`, { quantity });
  }

  async removeFromCart(itemId: string) {
    return this.delete(`/cart/${itemId}`);
  }

  async clearCart() {
    return this.delete('/cart');
  }

  // ==========================================
  // Wishlist
  // ==========================================

  async getWishlist() {
    return this.get('/wishlist');
  }

  async addToWishlist(productId: string) {
    return this.post('/wishlist', { productId });
  }

  async removeFromWishlist(productId: string) {
    return this.delete(`/wishlist/${productId}`);
  }

  // ==========================================
  // Addresses
  // ==========================================

  async getAddresses() {
    return this.get('/addresses');
  }

  async getAddress(id: string) {
    return this.get(`/addresses/${id}`);
  }

  async createAddress(data: any) {
    return this.post('/addresses', data);
  }

  async updateAddress(id: string, data: any) {
    return this.put(`/addresses/${id}`, data);
  }

  async deleteAddress(id: string) {
    return this.delete(`/addresses/${id}`);
  }

  // ==========================================
  // Orders
  // ==========================================

  async getOrders() {
    return this.get('/orders');
  }

  async getOrder(id: string) {
    return this.get(`/orders/${id}`);
  }

  async createOrder(data: any) {
    return this.post('/orders', data);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.put(`/orders/${orderId}/status`, { status });
  }

  // ==========================================
  // Payment Methods
  // ==========================================

  async getPaymentMethods() {
    return this.get('/payment-methods');
  }

  async getPaymentMethod(id: string) {
    return this.get(`/payment-methods/${id}`);
  }

  async createPaymentMethod(data: any) {
    return this.post('/payment-methods', data);
  }

  async updatePaymentMethod(id: string, data: any) {
    return this.put(`/payment-methods/${id}`, data);
  }

  async deletePaymentMethod(id: string) {
    return this.delete(`/payment-methods/${id}`);
  }

  async setDefaultPaymentMethod(id: string) {
    return this.put(`/payment-methods/${id}/set-default`, {});
  }

  // ==========================================
  // Notification Preferences
  // ==========================================

  async getNotificationPreferences() {
    return this.get('/notification-preferences');
  }

  async createNotificationPreferences(data: any) {
    return this.post('/notification-preferences', data);
  }

  async updateNotificationPreferences(data: any) {
    return this.put('/notification-preferences', data);
  }

  // Add patch method
  async patch<T = any>(endpoint: string, body: any = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();

// Restore token from localStorage on app load
const storedToken = localStorage.getItem('auth_token');
if (storedToken) {
  apiClient.setToken(storedToken);
}

