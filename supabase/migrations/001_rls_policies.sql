-- =============================================================================
-- Supabase RLS Policies - Himalayan Spices E-Commerce
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- This enables Row Level Security and adds policies so data shows correctly.
-- =============================================================================

-- Helper: returns true if current user is admin (used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: returns true if current user is admin or seller
CREATE OR REPLACE FUNCTION public.is_admin_or_seller()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'seller')
  );
$$;

-- =============================================================================
-- PROFILES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Admin can read all profiles
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (is_admin());

-- =============================================================================
-- PRODUCTS (public read; admin/seller write)
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin or seller can manage products" ON public.products;
CREATE POLICY "Admin or seller can manage products" ON public.products
  FOR ALL TO authenticated USING (is_admin_or_seller()) WITH CHECK (is_admin_or_seller());

-- =============================================================================
-- CATEGORIES (public read; admin/seller write)
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin or seller can manage categories" ON public.categories;
CREATE POLICY "Admin or seller can manage categories" ON public.categories
  FOR ALL TO authenticated USING (is_admin_or_seller()) WITH CHECK (is_admin_or_seller());

-- =============================================================================
-- SITE_SETTINGS (public read; admin write)
-- =============================================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read public site settings" ON public.site_settings;
CREATE POLICY "Anyone can read public site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage site settings" ON public.site_settings;
CREATE POLICY "Admin can manage site settings" ON public.site_settings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- ORDERS (user own + admin all)
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can read all orders" ON public.orders;
CREATE POLICY "Admin can read all orders" ON public.orders
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can update any order" ON public.orders;
CREATE POLICY "Admin can update any order" ON public.orders
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- ORDER_ITEMS (tied to orders)
-- =============================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin can read all order items" ON public.order_items;
CREATE POLICY "Admin can read all order items" ON public.order_items
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Authenticated can insert order items" ON public.order_items;
CREATE POLICY "Authenticated can insert order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- CART_ITEMS (user own only)
-- =============================================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- ADDRESSES (user own only)
-- =============================================================================
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- WISHLIST_ITEMS (user own only)
-- =============================================================================
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist_items
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- REVIEWS (public read approved; authenticated insert)
-- =============================================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
CREATE POLICY "Anyone can read approved reviews" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_approved = true);

DROP POLICY IF EXISTS "Authenticated can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated can insert reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- CONTACT_SUBMISSIONS (anon insert; admin read)
-- =============================================================================
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read contact submissions" ON public.contact_submissions;
CREATE POLICY "Admin can read contact submissions" ON public.contact_submissions
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admin can update contact submissions" ON public.contact_submissions;
CREATE POLICY "Admin can update contact submissions" ON public.contact_submissions
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- PUBLIC CONTENT (footer_links, social_media_accounts, contact_information, business_hours)
-- =============================================================================
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read footer links" ON public.footer_links;
CREATE POLICY "Anyone can read footer links" ON public.footer_links
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin can manage footer links" ON public.footer_links;
CREATE POLICY "Admin can manage footer links" ON public.footer_links
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Social media, contact info, business hours (skip if tables don't exist)
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read social media" ON public.social_media_accounts;
CREATE POLICY "Anyone can read social media" ON public.social_media_accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin can manage social media" ON public.social_media_accounts;
CREATE POLICY "Admin can manage social media" ON public.social_media_accounts FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE public.contact_information ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read contact info" ON public.contact_information;
CREATE POLICY "Anyone can read contact info" ON public.contact_information FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin can manage contact info" ON public.contact_information;
CREATE POLICY "Admin can manage contact info" ON public.contact_information FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read business hours" ON public.business_hours;
CREATE POLICY "Anyone can read business hours" ON public.business_hours FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin can manage business hours" ON public.business_hours;
CREATE POLICY "Admin can manage business hours" ON public.business_hours FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
