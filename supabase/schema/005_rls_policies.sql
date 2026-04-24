-- =============================================================================
-- 005_rls_policies.sql
-- Production-ready Row Level Security for all 22 tables
--
-- Strategy:
--   anon  = unauthenticated visitors
--   authenticated = logged-in users
--   is_admin()         = SECURITY DEFINER helper (no RLS recursion)
--   is_admin_or_seller() = SECURITY DEFINER helper
--
-- Run order: 003_functions.sql must be applied first.
-- Safe to re-run: uses DROP POLICY IF EXISTS before every CREATE POLICY.
-- =============================================================================

-- =============================================================================
-- PROFILES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: users read own"       ON public.profiles;
DROP POLICY IF EXISTS "profiles: users update own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles: users insert own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin read all"       ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update all"     ON public.profiles;

-- Users can read their own profile
CREATE POLICY "profiles: users read own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- Users can update their own profile (cannot change id or role)
CREATE POLICY "profiles: users update own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Users can insert their own profile (fallback; trigger handles this normally)
CREATE POLICY "profiles: users insert own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "profiles: admin read all" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

-- Admins can update any profile (including role changes)
CREATE POLICY "profiles: admin update all" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin());

-- =============================================================================
-- CATEGORIES
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories: public read active"  ON public.categories;
DROP POLICY IF EXISTS "categories: admin all"           ON public.categories;

-- Anyone (including anon) can read active categories
CREATE POLICY "categories: public read active" ON public.categories
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Admins can do everything
CREATE POLICY "categories: admin all" ON public.categories
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- PRODUCTS
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products: public read active"    ON public.products;
DROP POLICY IF EXISTS "products: seller manage own"     ON public.products;
DROP POLICY IF EXISTS "products: admin all"             ON public.products;

-- Anyone can read active products
CREATE POLICY "products: public read active" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Sellers can INSERT, UPDATE, DELETE their own products
CREATE POLICY "products: seller manage own" ON public.products
  FOR ALL TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Admins have full access
CREATE POLICY "products: admin all" ON public.products
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- PRODUCT_VARIANTS
-- =============================================================================
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variants: public read"       ON public.product_variants;
DROP POLICY IF EXISTS "variants: seller manage own" ON public.product_variants;
DROP POLICY IF EXISTS "variants: admin all"         ON public.product_variants;

CREATE POLICY "variants: public read" ON public.product_variants
  FOR SELECT TO anon, authenticated USING (true);

-- Sellers can manage variants of their own products
CREATE POLICY "variants: seller manage own" ON public.product_variants
  FOR ALL TO authenticated
  USING (
    product_id IN (SELECT id FROM public.products WHERE seller_id = auth.uid())
  )
  WITH CHECK (
    product_id IN (SELECT id FROM public.products WHERE seller_id = auth.uid())
  );

CREATE POLICY "variants: admin all" ON public.product_variants
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- ADDRESSES
-- =============================================================================
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses: users crud own" ON public.addresses;
DROP POLICY IF EXISTS "addresses: admin all"      ON public.addresses;

CREATE POLICY "addresses: users crud own" ON public.addresses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "addresses: admin all" ON public.addresses
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- CART_ITEMS
-- =============================================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart: users crud own" ON public.cart_items;
DROP POLICY IF EXISTS "cart: admin all"      ON public.cart_items;

CREATE POLICY "cart: users crud own" ON public.cart_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cart: admin all" ON public.cart_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- WISHLIST_ITEMS
-- =============================================================================
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist: users crud own" ON public.wishlist_items;
DROP POLICY IF EXISTS "wishlist: admin all"      ON public.wishlist_items;

CREATE POLICY "wishlist: users crud own" ON public.wishlist_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlist: admin all" ON public.wishlist_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- ORDERS
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders: users read own"   ON public.orders;
DROP POLICY IF EXISTS "orders: users insert own" ON public.orders;
DROP POLICY IF EXISTS "orders: admin all"        ON public.orders;

-- Users can read their own orders
CREATE POLICY "orders: users read own" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can place orders (insert with their user_id)
CREATE POLICY "orders: users insert own" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Admins/sellers have full access
CREATE POLICY "orders: admin all" ON public.orders
  FOR ALL TO authenticated USING (public.is_admin_or_seller()) WITH CHECK (public.is_admin_or_seller());

-- =============================================================================
-- ORDER_ITEMS
-- =============================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items: users read own" ON public.order_items;
DROP POLICY IF EXISTS "order_items: users insert"   ON public.order_items;
DROP POLICY IF EXISTS "order_items: admin all"      ON public.order_items;

-- Users can read items belonging to their orders
CREATE POLICY "order_items: users read own" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Users can insert items when creating an order
CREATE POLICY "order_items: users insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE POLICY "order_items: admin all" ON public.order_items
  FOR ALL TO authenticated USING (public.is_admin_or_seller()) WITH CHECK (public.is_admin_or_seller());

-- =============================================================================
-- ORDER_TRACKING
-- =============================================================================
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking: users read own" ON public.order_tracking;
DROP POLICY IF EXISTS "tracking: admin all"      ON public.order_tracking;

-- Users can read tracking for their orders
CREATE POLICY "tracking: users read own" ON public.order_tracking
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Only admins/sellers write tracking updates
CREATE POLICY "tracking: admin all" ON public.order_tracking
  FOR ALL TO authenticated USING (public.is_admin_or_seller()) WITH CHECK (public.is_admin_or_seller());

-- =============================================================================
-- PAYMENT_LOGS
-- =============================================================================
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_logs: users read own" ON public.payment_logs;
DROP POLICY IF EXISTS "payment_logs: admin all"      ON public.payment_logs;

-- Users can read payment logs for their own orders
CREATE POLICY "payment_logs: users read own" ON public.payment_logs
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Only admins can write payment logs
CREATE POLICY "payment_logs: admin all" ON public.payment_logs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- PAYMENT_METHODS
-- =============================================================================
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods: users crud own" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods: admin all"      ON public.payment_methods;

CREATE POLICY "payment_methods: users crud own" ON public.payment_methods
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment_methods: admin all" ON public.payment_methods
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- REVIEWS
-- =============================================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews: public read approved" ON public.reviews;
DROP POLICY IF EXISTS "reviews: users write own"      ON public.reviews;
DROP POLICY IF EXISTS "reviews: users update own"     ON public.reviews;
DROP POLICY IF EXISTS "reviews: users delete own"     ON public.reviews;
DROP POLICY IF EXISTS "reviews: admin all"            ON public.reviews;

-- Anyone can read approved reviews
CREATE POLICY "reviews: public read approved" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_approved = true);

-- Authenticated users can post a review
CREATE POLICY "reviews: users write own" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "reviews: users update own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY "reviews: users delete own" ON public.reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Admins can manage all reviews (including unapproved)
CREATE POLICY "reviews: admin all" ON public.reviews
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- NOTIFICATION_PREFERENCES
-- =============================================================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs: users crud own" ON public.notification_preferences;
DROP POLICY IF EXISTS "notif_prefs: admin all"      ON public.notification_preferences;

CREATE POLICY "notif_prefs: users crud own" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notif_prefs: admin all" ON public.notification_preferences
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- SITE_SETTINGS
-- =============================================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings: public read public" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings: auth read all"      ON public.site_settings;
DROP POLICY IF EXISTS "site_settings: admin write"        ON public.site_settings;

-- Anonymous users can read settings marked is_public = true
CREATE POLICY "site_settings: public read public" ON public.site_settings
  FOR SELECT TO anon USING (is_public = true);

-- Authenticated users can read all settings (needed for site config in app)
CREATE POLICY "site_settings: auth read all" ON public.site_settings
  FOR SELECT TO authenticated USING (true);

-- Only admins can write
CREATE POLICY "site_settings: admin write" ON public.site_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- ADMIN_DASHBOARD_SETTINGS
-- =============================================================================
ALTER TABLE public.admin_dashboard_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings: admin all" ON public.admin_dashboard_settings;

-- Strictly admin-only
CREATE POLICY "admin_settings: admin all" ON public.admin_dashboard_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- BUSINESS_HOURS
-- =============================================================================
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_hours: public read" ON public.business_hours;
DROP POLICY IF EXISTS "business_hours: admin write" ON public.business_hours;

CREATE POLICY "business_hours: public read" ON public.business_hours
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "business_hours: admin write" ON public.business_hours
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- CONTACT_INFORMATION
-- =============================================================================
ALTER TABLE public.contact_information ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_info: public read active" ON public.contact_information;
DROP POLICY IF EXISTS "contact_info: admin all"          ON public.contact_information;

CREATE POLICY "contact_info: public read active" ON public.contact_information
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "contact_info: admin all" ON public.contact_information
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- SOCIAL_MEDIA_ACCOUNTS
-- =============================================================================
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social: public read active" ON public.social_media_accounts;
DROP POLICY IF EXISTS "social: admin all"          ON public.social_media_accounts;

CREATE POLICY "social: public read active" ON public.social_media_accounts
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "social: admin all" ON public.social_media_accounts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- FOOTER_LINKS
-- =============================================================================
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "footer: public read active" ON public.footer_links;
DROP POLICY IF EXISTS "footer: admin all"          ON public.footer_links;

CREATE POLICY "footer: public read active" ON public.footer_links
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "footer: admin all" ON public.footer_links
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- CONTACT_SUBMISSIONS
-- =============================================================================
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_sub: anon insert"     ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_sub: users read own"  ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_sub: admin all"       ON public.contact_submissions;

-- Anyone (including guests) can submit the contact form
CREATE POLICY "contact_sub: anon insert" ON public.contact_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Logged-in users can view their own submissions
CREATE POLICY "contact_sub: users read own" ON public.contact_submissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admins have full access
CREATE POLICY "contact_sub: admin all" ON public.contact_submissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- UPLOADED_FILES
-- =============================================================================
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uploads: auth read all"      ON public.uploaded_files;
DROP POLICY IF EXISTS "uploads: auth insert own"    ON public.uploaded_files;
DROP POLICY IF EXISTS "uploads: users delete own"   ON public.uploaded_files;
DROP POLICY IF EXISTS "uploads: admin all"          ON public.uploaded_files;

-- Authenticated users can read all uploaded files (needed for product images etc)
CREATE POLICY "uploads: auth read all" ON public.uploaded_files
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can upload files
CREATE POLICY "uploads: auth insert own" ON public.uploaded_files
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- Users can delete their own uploads
CREATE POLICY "uploads: users delete own" ON public.uploaded_files
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Admins have full access
CREATE POLICY "uploads: admin all" ON public.uploaded_files
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
