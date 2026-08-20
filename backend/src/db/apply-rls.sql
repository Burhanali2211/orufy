-- =============================================================================
-- Self-Hosted RLS Policies - Himalayan Spices E-Commerce
-- Enables Row Level Security and adds tenant isolation policies for Node/Express.
-- =============================================================================

-- Helpers to get the current context from Node.js set_config
CREATE OR REPLACE FUNCTION public.app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.app_store_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_store_id', true), '')::uuid;
$$;

-- Helper: secure store membership verification
CREATE OR REPLACE FUNCTION public.is_store_member_secure(p_user_id uuid, p_store_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE user_id = p_user_id
    AND store_id = p_store_id
    AND role = ANY(p_roles)
  );
$$;

-- Helper: returns true if current user is a global platform admin
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = public.app_user_id() AND role = 'admin'
  );
$$;

-- Helper: returns true if current user has merchant permissions in the current store context
CREATE OR REPLACE FUNCTION public.is_store_merchant()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.is_store_member_secure(
    public.app_user_id(),
    public.app_store_id(),
    ARRAY['owner', 'admin', 'seller', 'staff']
  );
$$;

-- Helper: returns true if current user is an admin or owner of the store
CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.is_store_member_secure(
    public.app_user_id(),
    public.app_store_id(),
    ARRAY['owner', 'admin']
  );
$$;

-- =============================================================================
-- PROFILES & AUTH SAFETY ENSURANCE
-- =============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  token_type text NOT NULL DEFAULT 'EMAIL_VERIFICATION',
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = public.app_user_id()) WITH CHECK (id = public.app_user_id());

DROP POLICY IF EXISTS "Allow user registration" ON public.profiles;
CREATE POLICY "Allow user registration" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Admin can read all profiles
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT USING (public.is_global_admin());

-- SESSIONS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sessions open access" ON public.sessions;
CREATE POLICY "Sessions open access" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

-- EMAIL VERIFICATION TOKENS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Email tokens open access" ON public.email_verification_tokens;
CREATE POLICY "Email tokens open access" ON public.email_verification_tokens FOR ALL USING (true) WITH CHECK (true);



-- =============================================================================
-- PRODUCTS (public read; store merchant write)
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_store_isolation" ON public.products;

DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products" ON public.products
  FOR SELECT USING (store_id = public.app_store_id());

DROP POLICY IF EXISTS "Merchant can manage products" ON public.products;
CREATE POLICY "Merchant can manage products" ON public.products
  FOR ALL USING (
    store_id = public.app_store_id() AND public.is_store_merchant()
  ) WITH CHECK (
    store_id = public.app_store_id() AND public.is_store_merchant()
  );

-- =============================================================================
-- CATEGORIES (public read; store merchant write)
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories" ON public.categories
  FOR SELECT USING (store_id = public.app_store_id());

DROP POLICY IF EXISTS "Merchant can manage categories" ON public.categories;
CREATE POLICY "Merchant can manage categories" ON public.categories
  FOR ALL USING (
    store_id = public.app_store_id() AND public.is_store_merchant()
  ) WITH CHECK (
    store_id = public.app_store_id() AND public.is_store_merchant()
  );

-- =============================================================================
-- ORDERS (user own + store merchant all)
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT USING (user_id = public.app_user_id() AND store_id = public.app_store_id());

DROP POLICY IF EXISTS "Merchant can read all orders" ON public.orders;
CREATE POLICY "Merchant can read all orders" ON public.orders
  FOR SELECT USING (store_id = public.app_store_id() AND public.is_store_merchant());

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = public.app_user_id() AND store_id = public.app_store_id());

DROP POLICY IF EXISTS "Merchant can update any order" ON public.orders;
CREATE POLICY "Merchant can update any order" ON public.orders
  FOR UPDATE USING (store_id = public.app_store_id() AND public.is_store_merchant()) WITH CHECK (store_id = public.app_store_id() AND public.is_store_merchant());

-- =============================================================================
-- ORDER_ITEMS (tied to orders)
-- =============================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = public.app_user_id() AND o.store_id = public.app_store_id())
  );

DROP POLICY IF EXISTS "Merchant can read all order items" ON public.order_items;
CREATE POLICY "Merchant can read all order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.store_id = public.app_store_id()) AND public.is_store_merchant()
  );

DROP POLICY IF EXISTS "Merchant can insert order items" ON public.order_items;
CREATE POLICY "Merchant can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.store_id = public.app_store_id() AND (public.is_store_merchant() OR o.user_id = public.app_user_id()))
  );

-- =============================================================================
-- CART_ITEMS, ADDRESSES, WISHLIST_ITEMS (user own only)
-- =============================================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items
  FOR ALL USING (user_id = public.app_user_id()) WITH CHECK (user_id = public.app_user_id());

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (user_id = public.app_user_id()) WITH CHECK (user_id = public.app_user_id());

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist_items
  FOR ALL USING (user_id = public.app_user_id()) WITH CHECK (user_id = public.app_user_id());

-- =============================================================================
-- STORE_MEMBERS (Tenant isolation without recursion)
-- =============================================================================
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Merchants can manage members" ON public.store_members;
DROP POLICY IF EXISTS "Merchants can update members" ON public.store_members;
DROP POLICY IF EXISTS "Merchants can delete members" ON public.store_members;

DROP POLICY IF EXISTS "Store context required to read members" ON public.store_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.store_members;
CREATE POLICY "Users can read own memberships" ON public.store_members
  FOR SELECT USING (user_id = public.app_user_id() OR store_id = public.app_store_id());
  
DROP POLICY IF EXISTS "Admins can manage members" ON public.store_members;
CREATE POLICY "Admins can manage members" ON public.store_members
  FOR INSERT WITH CHECK (store_id = public.app_store_id() AND public.is_store_admin());
  
DROP POLICY IF EXISTS "Admins can update members" ON public.store_members;
CREATE POLICY "Admins can update members" ON public.store_members
  FOR UPDATE USING (store_id = public.app_store_id() AND public.is_store_admin()) WITH CHECK (store_id = public.app_store_id() AND public.is_store_admin());

DROP POLICY IF EXISTS "Admins can delete members" ON public.store_members;
CREATE POLICY "Admins can delete members" ON public.store_members
  FOR DELETE USING (store_id = public.app_store_id() AND public.is_store_admin());


-- =============================================================================
-- REVIEWS (public read approved; authenticated insert)
-- =============================================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
CREATE POLICY "Anyone can read approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true AND store_id = public.app_store_id());

DROP POLICY IF EXISTS "Authenticated can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (user_id = public.app_user_id() AND store_id = public.app_store_id());

-- =============================================================================
-- PUBLIC CONTENT (footer_links, etc.)
-- =============================================================================
-- Similar changes apply for store_id and is_store_merchant().
-- =============================================================================
-- 004_generalize_commerce.sql
-- Migration to generalize the commerce model.
-- Moves fragrance-specific columns into a JSONB `attributes` column.
-- =============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
-- =============================================================================
-- ORDERS & ORDER ITEMS RLS
-- =============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers can manage their own orders for the current store
DROP POLICY IF EXISTS "Customers can manage their own orders" ON public.orders;
CREATE POLICY "Customers can manage their own orders" ON public.orders
  FOR ALL USING (
    user_id = public.app_user_id() AND store_id = public.app_store_id()
  ) WITH CHECK (
    user_id = public.app_user_id() AND store_id = public.app_store_id()
  );

-- Merchants can manage store orders
DROP POLICY IF EXISTS "Merchants can manage store orders" ON public.orders;
CREATE POLICY "Merchants can manage store orders" ON public.orders
  FOR ALL USING (
    store_id = public.app_store_id() AND public.is_store_merchant()
  ) WITH CHECK (
    store_id = public.app_store_id() AND public.is_store_merchant()
  );

-- Customers can manage their own order items
DROP POLICY IF EXISTS "Customers can manage their own order items" ON public.order_items;
CREATE POLICY "Customers can manage their own order items" ON public.order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE user_id = public.app_user_id() AND store_id = public.app_store_id()
    )
  ) WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE user_id = public.app_user_id() AND store_id = public.app_store_id()
    )
  );

-- Merchants can manage store order items
DROP POLICY IF EXISTS "Merchants can manage store order items" ON public.order_items;
CREATE POLICY "Merchants can manage store order items" ON public.order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE store_id = public.app_store_id() AND public.is_store_merchant()
    )
  ) WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE store_id = public.app_store_id() AND public.is_store_merchant()
    )
  );

-- =============================================================================
-- CUSTOM DOMAINS RLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE,
  domain_type text NOT NULL DEFAULT 'custom',
  verification_token text NOT NULL,
  verification_method text NOT NULL DEFAULT 'dns_txt',
  verification_status text NOT NULL DEFAULT 'PENDING_VERIFICATION',
  verified_at timestamp with time zone,
  ssl_status text NOT NULL DEFAULT 'PENDING',
  ssl_expires_at timestamp with time zone,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DROP POLICY IF EXISTS "Public can resolve active custom domains" ON public.custom_domains;
DROP POLICY IF EXISTS "Merchants can manage custom domains" ON public.custom_domains;

CREATE POLICY "Custom domains read policy" ON public.custom_domains
  FOR SELECT USING (
    (public.app_store_id() IS NULL AND verification_status = 'VERIFIED' AND ssl_status = 'ACTIVE')
    OR
    (store_id = public.app_store_id() AND public.is_store_merchant())
  );

CREATE POLICY "Merchants can modify custom domains" ON public.custom_domains
  FOR ALL USING (
    store_id = public.app_store_id() AND public.is_store_merchant()
  ) WITH CHECK (
    store_id = public.app_store_id() AND public.is_store_merchant()
  );

GRANT ALL PRIVILEGES ON TABLE public.custom_domains TO platform_app;

CREATE UNIQUE INDEX IF NOT EXISTS custom_domains_store_primary_idx 
ON public.custom_domains (store_id) 
WHERE is_primary = true;

-- =============================================================================
-- DOMAIN REGISTRATIONS RLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.domain_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  custom_domain_id uuid REFERENCES public.custom_domains(id) ON DELETE SET NULL,
  domain_name text NOT NULL,
  provider text NOT NULL DEFAULT 'HOSTINGER',
  provider_domain_id text,
  provider_order_id text,
  registration_status text NOT NULL DEFAULT 'PENDING_PAYMENT',
  registration_period_years integer NOT NULL DEFAULT 1,
  purchase_price_paise integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  auto_renew boolean NOT NULL DEFAULT true,
  privacy_enabled boolean NOT NULL DEFAULT true,
  contact_info jsonb,
  dns_configured boolean NOT NULL DEFAULT false,
  registered_at timestamp with time zone,
  expires_at timestamp with time zone,
  failure_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.domain_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can manage own domain registrations" ON public.domain_registrations;
CREATE POLICY "Merchants can manage own domain registrations" ON public.domain_registrations
  FOR ALL USING (
    store_id = public.app_store_id() AND public.is_store_merchant()
  ) WITH CHECK (
    store_id = public.app_store_id() AND public.is_store_merchant()
  );

GRANT ALL PRIVILEGES ON TABLE public.domain_registrations TO platform_app;
