import { pgTable, text, timestamp, boolean, uuid, integer, jsonb, numeric, primaryKey, time, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash'),
  full_name: text('full_name'),
  phone: text('phone'),
  avatar_url: text('avatar_url'),
  role: text('role').default('customer').notNull(), // customer, merchant, admin
  is_super_admin: boolean('is_super_admin').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug'),
  hostname: text('hostname').notNull().unique(),
  logo_url: text('logo_url'),
  is_active: boolean('is_active').default(true).notNull(),
  tax_rate_percent: integer('tax_rate_percent').default(18).notNull(), // Configurable tax rate
  
  // Phase 8: Razorpay Route Linked Account for Merchant Settlements
  razorpay_linked_account_id: text('razorpay_linked_account_id').unique(),
  payment_onboarding_status: text('payment_onboarding_status').default('NOT_STARTED').notNull(), // NOT_STARTED, ACCOUNT_CREATED, KYC_PENDING, ACTIVATED, SUSPENDED
  
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const store_members = pgTable('store_members', {
  store_id: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(), // owner, admin, member, customer
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.store_id, t.user_id] }),
}));

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image_url: text('image_url'),
  parent_id: uuid('parent_id'), 
  sort_order: integer('sort_order').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug'),
  description: text('description'),
  short_description: text('short_description'),
  price: integer('price').default(0).notNull(), // stored in paise (minor units)
  original_price: integer('original_price'), // stored in paise (minor units)
  category_id: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  seller_id: uuid('seller_id').references(() => profiles.id, { onDelete: 'set null' }),
  images: text('images').array(),
  stock: integer('stock').default(0).notNull(),
  reserved_stock: integer('reserved_stock').default(0).notNull(), // Phase 12B: atomic checkout reservations
  min_stock_level: integer('min_stock_level').default(5).notNull(),
  sku: text('sku').unique(),
  dimensions: jsonb('dimensions'),
  tags: text('tags').array(),
  specifications: jsonb('specifications'),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00').notNull(),
  review_count: integer('review_count').default(0).notNull(),
  is_featured: boolean('is_featured').default(false).notNull(),
  show_on_homepage: boolean('show_on_homepage').default(true).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  meta_title: text('meta_title'),
  meta_description: text('meta_description'),
  attributes: jsonb('attributes').default(sql`'{}'::jsonb`),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq_store_slug: sql`UNIQUE (${t.store_id}, ${t.slug})`,
}));

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }), // Nullable for guest checkout
  guest_email: text('guest_email'),
  guest_phone: text('guest_phone'),
  order_number: text('order_number').unique().notNull(),
  status: text('status').default('ORDER_CREATED').notNull(), // ORDER_CREATED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, PAYMENT_EXPIRED
  payment_status: text('payment_status').default('PAYMENT_PENDING').notNull(), // PAYMENT_PENDING, PAYMENT_CAPTURED, PAYMENT_FAILED, PAYMENT_EXPIRED, REFUNDED, PARTIALLY_REFUNDED
  fulfillment_status: text('fulfillment_status').default('UNFULFILLED').notNull(), // UNFULFILLED, PACKED, SHIPPED, DELIVERED
  payment_method: text('payment_method').default('card'),
  razorpay_order_id: text('razorpay_order_id').unique(),
  razorpay_payment_id: text('razorpay_payment_id'),
  total_amount: integer('total_amount').default(0).notNull(), // stored in paise
  subtotal: integer('subtotal').default(0).notNull(), // stored in paise
  tax_amount: integer('tax_amount').default(0).notNull(), // stored in paise
  shipping_amount: integer('shipping_amount').default(0).notNull(), // stored in paise
  discount_amount: integer('discount_amount').default(0), // stored in paise
  refund_status: text('refund_status').default('NONE').notNull(), // NONE, REQUESTED, PARTIAL, FULL, FAILED
  refunded_amount: integer('refunded_amount').default(0).notNull(), // stored in paise
  currency: text('currency').default('INR').notNull(),
  shipping_address: jsonb('shipping_address').notNull(),
  billing_address: jsonb('billing_address').notNull(),
  notes: text('notes'),
  tracking_number: text('tracking_number'),
  carrier: text('carrier'),
  tracking_token: text('tracking_token'),
  shipped_at: timestamp('shipped_at', { withTimezone: true }),
  delivered_at: timestamp('delivered_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const order_items = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  variant_id: text('variant_id'),
  quantity: integer('quantity').notNull().default(1),
  unit_price: integer('unit_price').default(0).notNull(), // stored in paise
  total_price: integer('total_price').default(0).notNull(), // stored in paise
  product_snapshot: jsonb('product_snapshot'), // Record immutable product details at time of purchase
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const inventory_reservations = pgTable('inventory_reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  status: text('status').default('RESERVED').notNull(), // RESERVED, COMMITTED, RELEASED, EXPIRED
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const checkout_idempotency = pgTable('checkout_idempotency', {
  id: uuid('id').defaultRandom().primaryKey(),
  idempotency_key: text('idempotency_key').notNull(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  order_id: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  response_payload: jsonb('response_payload'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq_store_idempotency: sql`UNIQUE (${t.store_id}, ${t.idempotency_key})`,
}));

export const payment_transfers = pgTable('payment_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  razorpay_transfer_id: text('razorpay_transfer_id').unique().notNull(),
  linked_account_id: text('linked_account_id').notNull(),
  amount_paise: integer('amount_paise').notNull(),
  transfer_status: text('transfer_status').default('PENDING').notNull(), // PENDING, PROCESSED, FAILED
  settlement_id: text('settlement_id'),
  recipient_settlement_id: text('recipient_settlement_id'),
  settlement_status: text('settlement_status').default('PENDING').notNull(), // PENDING, PROCESSED, FAILED
  utr: text('utr'),
  settled_at: timestamp('settled_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const payment_webhook_events = pgTable('payment_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  razorpay_event_id: text('razorpay_event_id').unique().notNull(),
  event_type: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  processing_status: text('processing_status').default('PENDING').notNull(), // PENDING, PROCESSING, PROCESSED, RETRY, DEAD_LETTER
  attempt_count: integer('attempt_count').default(0).notNull(),
  max_attempts: integer('max_attempts').default(5).notNull(),
  last_attempt_at: timestamp('last_attempt_at', { withTimezone: true }),
  next_retry_at: timestamp('next_retry_at', { withTimezone: true }),
  error_message: text('error_message'),
  processed_at: timestamp('processed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const custom_domains = pgTable('custom_domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  hostname: text('hostname').notNull().unique(), // e.g. 'perfumery.com' or 'shop.brand.in'
  domain_type: text('domain_type').default('apex').notNull(), // apex, subdomain
  verification_token: text('verification_token').notNull(),
  verification_method: text('verification_method').default('DNS_TXT').notNull(),
  verification_status: text('verification_status').default('PENDING_VERIFICATION').notNull(), // PENDING_VERIFICATION, VERIFIED, FAILED
  verified_at: timestamp('verified_at', { withTimezone: true }),
  ssl_status: text('ssl_status').default('PENDING').notNull(), // PENDING, PROVISIONING, ACTIVE, FAILED
  ssl_expires_at: timestamp('ssl_expires_at', { withTimezone: true }),
  is_primary: boolean('is_primary').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const domain_registrations = pgTable('domain_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  custom_domain_id: uuid('custom_domain_id').references(() => custom_domains.id, { onDelete: 'set null' }),
  domain_name: text('domain_name').notNull().unique(),
  provider: text('provider').default('hostinger').notNull(),
  provider_domain_id: text('provider_domain_id'),
  provider_order_id: text('provider_order_id'),
  registration_status: text('registration_status').default('SEARCHED').notNull(), // SEARCHED, PENDING_PAYMENT, REGISTERED, DNS_CONFIGURED, FAILED
  registration_period_years: integer('registration_period_years').default(1).notNull(),
  purchase_price_paise: integer('purchase_price_paise').notNull(),
  currency: text('currency').default('INR').notNull(),
  auto_renew: boolean('auto_renew').default(true).notNull(),
  privacy_enabled: boolean('privacy_enabled').default(true).notNull(),
  contact_info: jsonb('contact_info'),
  dns_configured: boolean('dns_configured').default(false).notNull(),
  registered_at: timestamp('registered_at', { withTimezone: true }),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  failure_reason: text('failure_reason'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const communications_log = pgTable('communications_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  order_id: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  recipient: text('recipient').notNull(), // email or phone
  channel: text('channel').default('EMAIL').notNull(), // EMAIL, SMS, WHATSAPP
  event_type: text('event_type').notNull(), // ORDER_CONFIRMED, PAYMENT_RECEIVED, ORDER_PACKED, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, REFUND_PROCESSED
  subject: text('subject'),
  content: text('content').notNull(),
  status: text('status').default('DELIVERED').notNull(), // QUEUED, SENT, DELIVERED, FAILED
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const audit_logs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }),
  actor_user_id: uuid('actor_user_id').references(() => profiles.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // DOMAIN_ADDED, DOMAIN_VERIFIED, DOMAIN_REMOVED, PAYMENT_ACCOUNT_CONNECTED, PRODUCT_PRICE_CHANGED, ORDER_CANCELLED, etc.
  resource_type: text('resource_type').notNull(), // domain, payment, product, order, member
  resource_id: text('resource_id'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});


// ==========================================
// MIGRATED FROM SUPABASE (Multi-tenant added)
// ==========================================

export const product_variants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  price: integer('price').default(0).notNull(), // stored in paise
  stock: integer('stock').default(0).notNull(),
  attributes: jsonb('attributes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').default('home'),
  full_name: text('full_name').notNull(),
  phone: text('phone'),
  street_address: text('street_address').notNull(),
  city: text('city').notNull(),
  state: text('state'),
  postal_code: text('postal_code').notNull(),
  country: text('country').notNull(),
  is_default: boolean('is_default').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const cart_items = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variant_id: uuid('variant_id').references(() => product_variants.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(1),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq_cart_user_product_variant: sql`UNIQUE (${t.store_id}, ${t.user_id}, ${t.product_id}, ${t.variant_id})`,
}));

export const wishlist_items = pgTable('wishlist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq_wishlist_user_product: sql`UNIQUE (${t.store_id}, ${t.user_id}, ${t.product_id})`,
}));

export const order_tracking = pgTable('order_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  message: text('message'),
  location: text('location'),
  metadata: jsonb('metadata'),
  created_by: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const payment_logs = pgTable('payment_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  razorpay_payment_id: text('razorpay_payment_id'),
  razorpay_order_id: text('razorpay_order_id'),
  event_type: text('event_type').notNull(),
  status: text('status'),
  amount: integer('amount'),
  currency: text('currency').default('INR'),
  error_message: text('error_message'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const payment_methods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  last_four: text('last_four'),
  card_brand: text('card_brand'),
  expiry_month: text('expiry_month'),
  expiry_year: text('expiry_year'),
  cardholder_name: text('cardholder_name'),
  upi_id: text('upi_id'),
  billing_address: jsonb('billing_address'),
  is_default: boolean('is_default').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  title: text('title'),
  comment: text('comment'),
  images: text('images').array(),
  is_verified_purchase: boolean('is_verified_purchase').default(false).notNull(),
  is_approved: boolean('is_approved').default(true).notNull(),
  helpful_count: integer('helpful_count').default(0).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const notification_preferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  email_notifications: boolean('email_notifications').default(true).notNull(),
  sms_notifications: boolean('sms_notifications').default(false).notNull(),
  push_notifications: boolean('push_notifications').default(true).notNull(),
  order_updates: boolean('order_updates').default(true).notNull(),
  promotional_emails: boolean('promotional_emails').default(false).notNull(),
  newsletter: boolean('newsletter').default(true).notNull(),
  product_updates: boolean('product_updates').default(true).notNull(),
  price_alerts: boolean('price_alerts').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq_notif_store_user: sql`UNIQUE (${t.store_id}, ${t.user_id})`,
}));

export const site_settings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  setting_key: text('setting_key').notNull(),
  setting_value: text('setting_value'),
  setting_type: text('setting_type').default('text'),
  category: text('category').default('general'),
  description: text('description'),
  is_public: boolean('is_public').default(false).notNull(),
  updated_by: uuid('updated_by').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq_site_settings_store_key: sql`UNIQUE (${t.store_id}, ${t.setting_key})`,
}));

export const admin_dashboard_settings = pgTable('admin_dashboard_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  setting_key: text('setting_key').notNull(),
  setting_value: text('setting_value'),
  setting_type: text('setting_type').default('text'),
  category: text('category').default('dashboard'),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  updated_by: uuid('updated_by').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq_admin_settings_store_key: sql`UNIQUE (${t.store_id}, ${t.setting_key})`,
}));

export const business_hours = pgTable('business_hours', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  day_of_week: integer('day_of_week').notNull(), // 0=Sunday...6=Saturday
  is_open: boolean('is_open').default(true).notNull(),
  open_time: time('open_time'),
  close_time: time('close_time'),
  is_24_hours: boolean('is_24_hours').default(false).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq_business_hours_store_day: sql`UNIQUE (${t.store_id}, ${t.day_of_week})`,
}));

export const contact_information = pgTable('contact_information', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  contact_type: text('contact_type').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
  is_primary: boolean('is_primary').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  display_order: integer('display_order').default(0).notNull(),
  icon_name: text('icon_name'),
  additional_info: jsonb('additional_info'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const social_media_accounts = pgTable('social_media_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  platform_name: text('platform_name').notNull(),
  url: text('url').notNull(),
  username: text('username'),
  icon_name: text('icon_name'),
  is_active: boolean('is_active').default(true).notNull(),
  display_order: integer('display_order').default(0).notNull(),
  follower_count: integer('follower_count').default(0).notNull(),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const footer_links = pgTable('footer_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  section_name: text('section_name').notNull(),
  link_text: text('link_text').notNull(),
  link_url: text('link_url').notNull(),
  display_order: integer('display_order').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  opens_new_tab: boolean('opens_new_tab').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const contact_submissions = pgTable('contact_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').default('new').notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  admin_notes: text('admin_notes'),
  replied_at: timestamp('replied_at', { withTimezone: true }),
  replied_by: uuid('replied_by').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const uploaded_files = pgTable('uploaded_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  store_id: uuid('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  folder: text('folder').default('uploads').notNull(),
  mime_type: text('mime_type').notNull(),
  file_size: integer('file_size').notNull(),
  file_data: text('file_data').notNull(), // base64 or path
  url_path: text('url_path').notNull(),
  uploaded_by: uuid('uploaded_by').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
