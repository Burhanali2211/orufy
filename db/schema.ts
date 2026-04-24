import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Enums
export const planEnum = pgEnum('plan', ['basic', 'standard', 'premium']);
export const statusEnum = pgEnum('status', ['active', 'suspended', 'cancelled']);
export const roleEnum = pgEnum('role', ['owner', 'staff']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['created', 'active', 'halted', 'cancelled', 'completed']);

// 1. Tenants
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: planEnum('plan').notNull().default('basic'),
  status: statusEnum('status').notNull().default('active'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('tenants_slug_idx').on(table.slug),
]);

// 2. Users (Better Auth compatible)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: roleEnum('role').notNull().default('owner'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('users_tenant_id_idx').on(table.tenantId),
  index('users_email_idx').on(table.email),
]);

// 3. Sessions (Better Auth compatible)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_tenant_id_idx').on(table.tenantId),
  index('sessions_expires_at_idx').on(table.expiresAt),
]);

// 3.5 Accounts & Verifications (For Better Auth)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 4. Products
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  comparePrice: integer('compare_price'),
  stock: integer('stock').notNull().default(0),
  sku: text('sku'),
  imageUrls: jsonb('image_urls').default([]),
  category: text('category'),
  tags: jsonb('tags').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('products_tenant_id_idx').on(table.tenantId),
  index('products_tenant_active_idx').on(table.tenantId, table.isActive),
]);

// 5. Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  orderNumber: text('order_number').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  shippingAddress: jsonb('shipping_address').notNull(),
  items: jsonb('items').notNull(),
  subtotal: integer('subtotal').notNull(),
  taxAmount: integer('tax_amount').default(0),
  shippingFee: integer('shipping_fee').default(0),
  discountAmount: integer('discount_amount').default(0),
  total: integer('total').notNull(),
  status: orderStatusEnum('status').default('pending'),
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  paymentMethod: text('payment_method'),
  trackingNumber: text('tracking_number'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('orders_tenant_id_idx').on(table.tenantId),
  index('orders_tenant_status_idx').on(table.tenantId, table.status),
]);

// 6. Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  razorpaySubscriptionId: text('razorpay_subscription_id').notNull().unique(),
  razorpayPlanId: text('razorpay_plan_id').notNull(),
  plan: planEnum('plan').notNull(),
  status: subscriptionStatusEnum('status').notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  failureCount: integer('failure_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 7. Custom Domains
export const customDomains = pgTable('custom_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull().unique(),
  verified: boolean('verified').default(false),
  verificationToken: text('verification_token').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('custom_domains_domain_idx').on(table.domain),
]);

// 8. Order Tracking
export const orderTracking = pgTable('order_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  message: text('message'),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('order_tracking_order_id_idx').on(table.orderId),
]);

// 9. Reviews
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  isApproved: boolean('is_approved').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('reviews_product_id_idx').on(table.productId),
  index('reviews_user_id_idx').on(table.userId),
]);

// 10. Categories
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  parentId: uuid('parent_id'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('categories_tenant_id_idx').on(table.tenantId),
]);

// 11. Social Media Accounts
export const socialMediaAccounts = pgTable('social_media_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  platformName: text('platform_name').notNull(),
  url: text('url').notNull(),
  username: text('username'),
  iconName: text('icon_name').notNull(),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  followerCount: integer('follower_count'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Site Settings
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  settingKey: text('setting_key').notNull(),
  settingValue: text('setting_value'),
  settingType: text('setting_type').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Policy Pages
export const policyPages = pgTable('policy_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  content: text('content'),
  type: text('type').notNull(),
  isActive: boolean('is_active').default(true),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// 14. Footer Links
export const footerLinks = pgTable('footer_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  section: text('section').notNull(),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
});

// 15. Contact Information
export const contactInformation = pgTable('contact_information', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  value: text('value').notNull(),
  label: text('label'),
  isPrimary: boolean('is_primary').default(false),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
});

// 16. Contact Submissions
export const contactSubmissions = pgTable('contact_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject'),
  message: text('message').notNull(),
  status: text('status').default('new'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Infer Models
export type Tenant = InferSelectModel<typeof tenants>;
export type NewTenant = InferInsertModel<typeof tenants>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type Verification = InferSelectModel<typeof verifications>;
export type NewVerification = InferInsertModel<typeof verifications>;

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;

export type CustomDomain = InferSelectModel<typeof customDomains>;
export type NewCustomDomain = InferInsertModel<typeof customDomains>;

export type OrderTracking = InferSelectModel<typeof orderTracking>;
export type NewOrderTracking = InferInsertModel<typeof orderTracking>;

export type Review = InferSelectModel<typeof reviews>;
export type NewReview = InferInsertModel<typeof reviews>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type SocialMediaAccount = InferSelectModel<typeof socialMediaAccounts>;
export type NewSocialMediaAccount = InferInsertModel<typeof socialMediaAccounts>;

export type SiteSetting = InferSelectModel<typeof siteSettings>;
export type NewSiteSetting = InferInsertModel<typeof siteSettings>;

export type PolicyPage = InferSelectModel<typeof policyPages>;
export type NewPolicyPage = InferInsertModel<typeof policyPages>;

export type FooterLink = InferSelectModel<typeof footerLinks>;
export type NewFooterLink = InferInsertModel<typeof footerLinks>;

export type ContactInfo = InferSelectModel<typeof contactInformation>;
export type NewContactInfo = InferInsertModel<typeof contactInformation>;

export type ContactSubmission = InferSelectModel<typeof contactSubmissions>;
export type NewContactSubmission = InferInsertModel<typeof contactSubmissions>;