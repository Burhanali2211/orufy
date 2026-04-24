export interface User {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  role: 'admin' | 'seller' | 'customer' | 'owner' | 'staff';
  tenantId: string;
  emailVerified?: boolean;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive?: boolean;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  taxId?: string;
  preferredLanguage?: string;
  newsletterSubscribed?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  password?: string;
  shopName?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'basic' | 'standard' | 'premium';
  status: 'active' | 'suspended' | 'cancelled';
  settings: TenantSettings;
  createdAt: string;
}

export interface TenantSettings {
  primaryColor?: string;
  logo?: string;
  bannerUrl?: string;
  about?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  comparePrice?: number;
  categoryId: string;
  category?: string;
  tenantId?: string;
  images: string[];
  imageUrls?: string[];
  stock: number;
  minStockLevel?: number;
  sku?: string;
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  rating: number;
  reviewCount?: number;
  reviews: Review[];
  sellerId: string;
  sellerName: string;
  tags: string[];
  specifications?: Record<string, string | number | boolean>;
  featured: boolean;
  showOnHomepage: boolean;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
  productCount: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
  productIds: string[];
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
  id?: string;
  product: Product;
  productId?: string;
  variantId?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  name?: string;
  price?: number;
  imageUrl?: string;
  selectedOptions?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WishlistItem {
  id?: string;
  product: Product;
  productId?: string;
  createdAt?: Date | string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
  isApproved?: boolean;
  helpfulCount?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  product_id?: string;
  user_id?: string;
  created_at?: string;
}

export interface ShippingAddress {
  line1?: string;
  line2?: string;
  city: string;
  state: string;
  pincode?: string;
  country: string;
  fullName?: string;
  phone?: string;
  // legacy compat
  streetAddress?: string;
  street?: string;
  postalCode?: string;
  zipCode?: string;
}

export interface Address {
  id?: string;
  userId?: string;
  type?: 'shipping' | 'billing';
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // legacy compat
  street?: string;
  zipCode?: string;
  line1?: string;
  line2?: string;
  pincode?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  tenantId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  shippingFee?: number;
  discountAmount?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentId?: string;
  currency?: string;
  shippingAddress: Address | ShippingAddress;
  billingAddress?: Address;
  notes?: string;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date | string;
  updatedAt?: Date | string;
  trackingHistory?: OrderTracking[];
  user_id?: string;
  shipping_address?: Address | ShippingAddress;
  created_at?: string;
  updated_at?: string;
  tracking_history?: TrackingEvent[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  name?: string;
  price?: number;
  imageUrl?: string;
  productSnapshot?: Record<string, unknown>;
  createdAt?: Date | string;
  product?: Product;
}

export interface OrderTracking {
  id: string;
  orderId: string;
  status: string;
  message?: string;
  location?: string;
  createdAt: Date | string;
}

export interface TrackingEvent {
  status: string;
  date: Date;
  location: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceAdjustment: number;
  stock: number;
  sku?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumAmount: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: Date;
  validUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

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

export interface UserPreferences {
  id?: string;
  userId: string;
  emailOrderUpdates: boolean;
  emailPromotions: boolean;
  emailNewsletter: boolean;
  emailSecurity: boolean;
  emailProductUpdates: boolean;
  pushOrderUpdates: boolean;
  pushPromotions: boolean;
  pushNewsletter: boolean;
  pushSecurity: boolean;
  pushProductUpdates: boolean;
  smsOrderUpdates: boolean;
  smsPromotions: boolean;
  smsNewsletter: boolean;
  smsSecurity: boolean;
  smsProductUpdates: boolean;
  language: string;
  timezone: string;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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

export interface ApiResponse<T = unknown> {
  data?: T;
  success?: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void | Promise<void>;
  register: (userData: Partial<User>) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, additionalData?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth?: (provider: string) => Promise<void>;
  getSession?: () => Promise<{ session: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string, token?: string) => Promise<void>;
  resendVerification: (email?: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  openMobileAuth: (mode?: 'login' | 'signup' | 'profile') => void;
  closeMobileAuth: () => void;
  isMobileAuthOpen: boolean;
  mobileAuthMode: 'login' | 'signup' | 'profile';
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
  addProduct?: (data: Partial<Product>) => Promise<unknown>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<unknown>;
  deleteProduct: (productId: string) => Promise<void>;
  fetchReviewsForProduct: (productId: string) => Promise<Review[]>;
  submitReview?: (review: Omit<Review, 'id' | 'createdAt' | 'profiles'>) => Promise<void>;
  fetchProducts: (page?: number, limit?: number, filters?: Record<string, unknown>) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchFeaturedProducts: (limit?: number) => Promise<void>;
  fetchBestSellers: (limit?: number) => Promise<void>;
  fetchLatestProducts: (limit?: number) => Promise<void>;
  getProductById: (id: string) => Promise<Product | null>;
  getProductBySlug?: (slug: string) => Promise<Product | null>;
  searchProducts?: (query: string) => Promise<void>;
  filterByCategory?: (categoryId: string) => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<unknown>;
  createCategory?: (data: Partial<Category>) => Promise<unknown>;
  updateCategory?: (id: string, data: Partial<Category>) => Promise<unknown>;
  deleteCategory?: (id: string) => Promise<void>;
  nextPage?: () => void;
  previousPage?: () => void;
  goToPage?: (page: number) => void;
  loading: boolean;
  basicLoading?: boolean;
  detailsLoading?: boolean;
  featuredLoading: boolean;
  bestSellersLoading: boolean;
  latestLoading: boolean;
  isUsingMockData?: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  addCategory?: (category: Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  error?: string | null;
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
  createOrder: (items: CartItem[], shippingAddress: Address, paymentMethod: string, total: number, razorpay_order_id?: string) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  getUserOrders: (userId?: string) => Promise<Order[]>;
  loading: boolean;
}

export interface AddressContextType {
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string, type: 'shipping' | 'billing') => Promise<void>;
  fetchAddresses: () => Promise<void>;
  loading: boolean;
}

export interface SiteSetting {
  settingKey: string;
  settingValue: string;
  settingType: string;
  category: string;
  description: string;
}

export interface SocialMediaAccount {
  platform: string;
  platformName: string;
  url: string;
  username: string;
  iconName: string;
  followerCount: number;
  description: string;
  isActive?: boolean;
}

export interface ContactInfo {
  contactType: string;
  label: string;
  value: string;
  isPrimary: boolean;
  iconName: string;
  additionalInfo: unknown;
}

export interface FooterLink {
  id: string;
  sectionName: string;
  linkText: string;
  linkUrl: string;
  opensNewTab: boolean;
}

export interface BusinessHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  is24Hours: boolean;
  notes: string;
}

export interface PublicSettings {
  siteSettings: SiteSetting[];
  socialMedia: SocialMediaAccount[];
  contactInfo: ContactInfo[];
  footerLinks: FooterLink[];
  businessHours: BusinessHours[];
}

export interface SettingsContextType {
  settings: PublicSettings;
  loading: boolean;
  error: string | null;
  getSiteSetting: (key: string) => string | undefined;
  getSiteSettingsByCategory: (category: string) => SiteSetting[];
  refetch: () => Promise<void>;
}

export type OrderStats = {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: number;
};
