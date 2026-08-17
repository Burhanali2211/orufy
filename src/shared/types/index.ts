export interface User {
  id: string;
  name?: string; // Alias for fullName (for backward compatibility)
  fullName?: string; // Maps to full_name in DB
  email: string;
  role: 'admin' | 'seller' | 'customer' | 'merchant';
  avatar?: string; // Maps to avatar_url in DB
  phone?: string;
  dateOfBirth?: string; // Maps to date_of_birth in DB
  gender?: string; // Maps to gender in DB
  isActive?: boolean; // Maps to is_active in DB
  emailVerified?: boolean; // Maps to email_verified in DB
  // Seller specific fields
  businessName?: string; // Maps to business_name in DB
  businessAddress?: string; // Maps to business_address in DB
  businessPhone?: string; // Maps to business_phone in DB
  taxId?: string; // Maps to tax_id in DB
  // Customer specific fields
  preferredLanguage?: string; // Maps to preferred_language in DB
  newsletterSubscribed?: boolean; // Maps to newsletter_subscribed in DB
  createdAt: Date; // Maps to created_at in DB
  updatedAt?: Date; // Maps to updated_at in DB
  password?: string; // Added for registration
}

export interface Store {
  id: string;
  name: string;
  slug?: string | null;
  hostname: string; // e.g. 'seriqueavenue.get-oru.com'
  logo_url?: string | null;
  is_active?: boolean;
}


  export interface Product {
    id: string;
    name: string;
    slug?: string; // New field from DB
    description: string;
    shortDescription?: string; // Maps to short_description in DB
    price: number;
    originalPrice?: number; // Maps to original_price in DB
    categoryId: string; // Maps to category_id in DB
    category?: string; // Category name for display
    images: string[];
    stock: number;
    minStockLevel?: number; // Maps to min_stock_level in DB
    sku?: string; // New field from DB
    weight?: number; // New field from DB
    dimensions?: { length?: number; width?: number; height?: number }; // New field from DB
    rating: number;
    reviewCount?: number; // Maps to review_count in DB
    reviews: Review[];
    sellerId: string; // Maps to seller_id in DB
    sellerName: string;
    tags: string[];
    specifications?: Record<string, string | number | boolean>; // Maps to specifications in DB
    featured: boolean; // Maps to is_featured in DB
    showOnHomepage: boolean; // Maps to show_on_homepage in DB
    isActive?: boolean; // Maps to is_active in DB
    metaTitle?: string; // Maps to meta_title in DB
    metaDescription?: string; // Maps to meta_description in DB
    attributes?: Record<string, any>; // Generalized JSONB attributes
    createdAt: Date; // Maps to created_at in DB
    updatedAt?: Date; // Maps to updated_at in DB
  }

export interface Category {
  id: string;
  name: string;
  slug?: string; // New field from DB
  description?: string; // New field from DB
  imageUrl: string; // Maps to image_url in DB (changed from 'image' to 'imageUrl')
  parentId?: string; // Maps to parent_id in DB
  isActive?: boolean; // Maps to is_active in DB
  sortOrder?: number; // Maps to sort_order in DB
  productCount: number;
  createdAt?: Date; // Maps to created_at in DB
  updatedAt?: Date; // Maps to updated_at in DB
}

export interface Collection {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  image: string;
  bannerImage?: string;
  type: 'seasonal' | 'limited' | 'signature' | 'exclusive' | 'heritage' | 'modern';
  status: 'active' | 'inactive' | 'coming_soon' | 'sold_out';
  price?: number;
  originalPrice?: number;
  discount?: number;
  productIds: string[]; // Array of product IDs in this collection
  productCount: number;
  featured: boolean;
  isExclusive: boolean;
  launchDate?: Date;
  endDate?: Date;
  sortOrder?: number;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Collection {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  image: string;
  bannerImage?: string;
  type: 'seasonal' | 'limited' | 'signature' | 'exclusive' | 'heritage' | 'modern';
  status: 'active' | 'inactive' | 'coming_soon' | 'sold_out';
  price?: number;
  originalPrice?: number;
  discount?: number;
  productIds: string[]; // Array of product IDs in this collection
  productCount: number;
  featured: boolean;
  isExclusive: boolean;
  launchDate?: Date;
  endDate?: Date;
  sortOrder?: number;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id?: string; // New field from DB
  product: Product;
  productId?: string; // Maps to product_id in DB
  variantId?: string; // Maps to variant_id in DB
  quantity: number;
  unitPrice?: number; // Maps to unit_price in DB
  totalPrice?: number; // Maps to total_price in DB
  createdAt?: Date; // Maps to created_at in DB
  updatedAt?: Date; // Maps to updated_at in DB
}

export interface WishlistItem {
  id?: string; // New field from DB
  product: Product;
  productId?: string; // Maps to product_id in DB
  createdAt?: Date; // Maps to created_at in DB
}

export interface Review {
  id: string;
  productId: string; // Maps to product_id in DB
  userId: string; // Maps to user_id in DB
  rating: number;
  title?: string; // New field from DB
  comment?: string;
  images?: string[]; // New field from DB
  isVerifiedPurchase?: boolean; // Maps to is_verified_purchase in DB
  isApproved?: boolean; // Maps to is_approved in DB
  helpfulCount?: number; // Maps to helpful_count in DB
  createdAt: Date; // Maps to created_at in DB
  updatedAt?: Date; // Maps to updated_at in DB
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  // Legacy fields for backward compatibility
  product_id?: string;
  user_id?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // Maps to order_number in DB
  userId: string; // Maps to user_id in DB
  items: OrderItem[];
  total: number; // Maps to total_amount in DB
  subtotal: number; // Maps to subtotal in DB
  taxAmount: number; // Maps to tax_amount in DB
  shippingAmount: number; // Maps to shipping_amount in DB
  discountAmount?: number; // Maps to discount_amount in DB
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'; // Maps to payment_status in DB
  paymentMethod?: string; // Maps to payment_method in DB
  paymentId?: string; // Maps to payment_id in DB
  currency?: string; // New field from DB
  shippingAddress: Address; // Maps to shipping_address in DB (JSONB)
  billingAddress?: Address; // Maps to billing_address in DB (JSONB)
  notes?: string;
  trackingNumber?: string; // Maps to tracking_number in DB
  shippedAt?: Date; // Maps to shipped_at in DB
  deliveredAt?: Date; // Maps to delivered_at in DB
  createdAt: Date; // Maps to created_at in DB
  updatedAt?: Date; // Maps to updated_at in DB
  trackingHistory?: OrderTracking[]; // From order_tracking table
  // Legacy fields for backward compatibility
  user_id?: string;
  shipping_address?: Address;
  created_at?: string;
  updated_at?: string;
  tracking_history?: TrackingEvent[];
}

export interface OrderItem {
  id: string;
  orderId: string; // Maps to order_id in DB
  productId: string; // Maps to product_id in DB
  variantId?: string; // Maps to variant_id in DB
  quantity: number;
  unitPrice: number; // Maps to unit_price in DB
  totalPrice: number; // Maps to total_price in DB
  productSnapshot?: Record<string, unknown>; // Maps to product_snapshot in DB (JSONB)
  createdAt: Date; // Maps to created_at in DB
  product?: Product; // Populated from join
}

export interface OrderTracking {
  id: string;
  orderId: string; // Maps to order_id in DB
  status: string;
  message?: string;
  location?: string;
  createdAt: Date; // Maps to created_at in DB
}

export interface TrackingEvent {
  status: string;
  date: Date;
  location: string;
}

export interface Address {
  id?: string;
  userId?: string; // Maps to user_id in DB
  type?: 'shipping' | 'billing';
  fullName: string; // Maps to full_name in DB
  streetAddress: string; // Maps to street_address in DB
  city: string;
  state: string;
  postalCode: string; // Maps to postal_code in DB
  country: string;
  phone?: string;
  isDefault?: boolean; // Maps to is_default in DB
  createdAt?: Date; // Maps to created_at in DB
  updatedAt?: Date; // Maps to updated_at in DB
  // Legacy fields for backward compatibility
  street?: string;
  zipCode?: string;
}

export interface ProductVariant {
  id: string;
  productId: string; // Maps to product_id in DB
  name: string;
  value: string;
  priceAdjustment: number; // Maps to price_adjustment in DB
  stock: number;
  sku?: string;
  isActive: boolean; // Maps to is_active in DB
  createdAt?: Date; // Maps to created_at in DB
  updatedAt?: Date; // Maps to updated_at in DB
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumAmount: number; // Maps to minimum_amount in DB
  maximumDiscount?: number; // Maps to maximum_discount in DB
  usageLimit?: number; // Maps to usage_limit in DB
  usedCount: number; // Maps to used_count in DB
  isActive: boolean; // Maps to is_active in DB
  validFrom: Date; // Maps to valid_from in DB
  validUntil?: Date; // Maps to valid_until in DB
  createdAt?: Date; // Maps to created_at in DB
  updatedAt?: Date; // Maps to updated_at in DB
}

// New interfaces for additional database tables
export interface DashboardAnalytics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: Order[];
  topProducts: Product[];
  salesTrends: SalesTrend[];
  categoryPerformance: CategoryPerformance[];
}

export interface SalesTrend {
  date: string;
  sales: number;
  orders: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface AuthContextType {
  user: User | null;
  store: Store | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, additionalData?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;

  // Mobile authentication functionality
  openMobileAuth: (mode?: 'login' | 'signup' | 'profile') => void;
  closeMobileAuth: () => void;
  isMobileAuthOpen: boolean;
  mobileAuthMode: 'login' | 'signup' | 'profile';
  setMobileAuthMode: (mode: 'login' | 'signup' | 'profile') => void;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
  loading: boolean;
}

export interface ProductContextType {
  products: Product[];
  featuredProducts: Product[];
  bestSellers: Product[];
  latestProducts: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  fetchReviewsForProduct: (productId: string) => Promise<Review[]>;
  submitReview: (review: Omit<Review, 'id' | 'createdAt' | 'profiles'>) => Promise<void>;
  fetchProducts: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchFeaturedProducts: (limit?: number) => Promise<void>;
  fetchBestSellers: (limit?: number) => Promise<void>;
  fetchLatestProducts: (limit?: number) => Promise<void>;
  getProductById: (id: string) => Promise<any>;
  searchProducts: (query: string) => Promise<void>;
  filterByCategory: (categoryId: string) => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<any>;
  createCategory: (data: Partial<Category>) => Promise<any>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<any>;
  deleteCategory: (id: string) => Promise<void>;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  loading: boolean;
  basicLoading?: boolean;
  detailsLoading?: boolean;
  featuredLoading?: boolean;
  bestSellersLoading?: boolean;
  latestLoading?: boolean;
  isUsingMockData?: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  // Category management functions (legacy)
  addCategory?: (category: Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export interface WishlistContextType {
  items: WishlistItem[];
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  loading: boolean;
}

export interface OrderContextType {
  orders: Order[];
  createOrder: (items: CartItem[], shippingAddress: Address, paymentMethod: string, total: number, razorpay_order_id?: string) => Promise<{ orderId: string, razorpayOrderId: string | null } | null>;
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  getUserOrders: (userId?: string) => Promise<Order[]>;
  loading: boolean;
}

// New context types for additional functionality
export interface AddressContextType {
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string, type: 'shipping' | 'billing') => Promise<void>;
  fetchAddresses: () => Promise<void>;
  loading: boolean;
}

// User Preferences Types
export interface UserPreferences {
  id?: string;
  userId: string;
  // Email notifications
  emailOrderUpdates: boolean;
  emailPromotions: boolean;
  emailNewsletter: boolean;
  emailSecurity: boolean;
  emailProductUpdates: boolean;
  // Push notifications
  pushOrderUpdates: boolean;
  pushPromotions: boolean;
  pushNewsletter: boolean;
  pushSecurity: boolean;
  pushProductUpdates: boolean;
  // SMS notifications
  smsOrderUpdates: boolean;
  smsPromotions: boolean;
  smsNewsletter: boolean;
  smsSecurity: boolean;
  smsProductUpdates: boolean;
  // General preferences
  language: string;
  timezone: string;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Security Settings Types
export interface UserSecuritySettings {
  id?: string;
  userId: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'email' | 'sms' | 'authenticator';
  twoFactorPhone?: string;
  twoFactorBackupCodes?: string[];
  loginAlerts: boolean;
  suspiciousActivityAlerts: boolean;
  sessionTimeout: number;
  requirePasswordForSensitiveActions: boolean;
  passwordChangedAt?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Payment Method Types
export interface PaymentMethod {
  id?: string;
  userId: string;
  type: 'credit' | 'debit' | 'paypal' | 'bank_account';
  provider: string;
  lastFour: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName: string;
  billingAddressId?: string;
  isDefault: boolean;
  isVerified: boolean;
  encryptedData?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
