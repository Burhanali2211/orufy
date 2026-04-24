-- =============================================================================
-- 007_seed_data.sql
-- Default data required for the application to function on a fresh database.
--
-- Idempotency strategy:
--   • Tables with a UNIQUE key   → INSERT ... ON CONFLICT (key) DO UPDATE
--   • Tables without a UNIQUE key → wrapped in DO $$ IF NOT EXISTS ... $$ so
--     re-running never creates duplicate rows.
-- =============================================================================

-- =============================================================================
-- 1. SITE SETTINGS
-- (unique key: setting_key)
-- =============================================================================
INSERT INTO public.site_settings (setting_key, setting_value, category, is_public, description)
VALUES
  -- Branding
  ('site_name',            '"orufy"',                              'branding',  true,  'The public name of the store'),
  ('site_tagline',         '"Pure Attars from the Heart of Aligarh"',       'branding',  true,  'Shown below the site name on the homepage'),
  ('site_logo_url',        '"/logo.png"',                                   'branding',  true,  'Path or URL to the site logo'),
  ('site_favicon_url',     '"/favicon.ico"',                                'branding',  true,  'Path or URL to the favicon'),
  ('site_currency',        '"INR"',                                         'branding',  true,  'ISO 4217 currency code'),
  ('site_currency_symbol', '"₹"',                                           'branding',  true,  'Currency symbol displayed in the UI'),

  -- Contact
  ('contact_email',        '"info@orufy.com"',                       'contact',   true,  'Public contact email address'),
  ('contact_phone',        '"+91 00000 00000"',                             'contact',   true,  'Public phone number'),
  ('contact_address',      '"Aligarh, Uttar Pradesh, India"',               'contact',   true,  'Business address shown on contact page'),
  ('support_email',        '"support@orufy.com"',                    'contact',   false, 'Internal support email (not shown publicly)'),

  -- SEO
  ('meta_title',           '"orufy – Authentic Indian Perfumes"',  'seo',       true,  'Default HTML <title> tag'),
  ('meta_description',     '"Shop pure, authentic attars and perfumes crafted in the tradition of Aligarh."', 'seo', true, 'Default meta description'),

  -- Shipping
  ('free_shipping_threshold', '499',  'shipping', true,  'Order total (INR) above which shipping is free'),
  ('default_shipping_charge', '50',   'shipping', true,  'Flat shipping charge when below threshold'),
  ('cod_enabled',             'true', 'shipping', true,  'Whether Cash on Delivery is available'),
  ('cod_extra_charge',        '0',    'shipping', true,  'Extra charge for COD orders'),

  -- Payments
  ('razorpay_enabled',  'true', 'payments', false, 'Enable Razorpay payment gateway'),
  ('razorpay_key_id',   '""',   'payments', false, 'Razorpay Key ID (set via admin panel)'),

  -- Features
  ('reviews_enabled',          'true',  'features', true,  'Allow customers to submit product reviews'),
  ('reviews_require_approval', 'true',  'features', false, 'Hold reviews for admin approval before publishing'),
  ('wishlist_enabled',         'true',  'features', true,  'Enable wishlist feature'),
  ('compare_enabled',          'true',  'features', true,  'Enable product comparison feature'),
  ('guest_checkout_enabled',   'false', 'features', true,  'Allow guests to check out without an account'),

  -- Appearance
  ('products_per_page', '12', 'appearance', true, 'Default number of products per listing page'),
  ('hero_image_url',    '""', 'appearance', true, 'Homepage hero/banner image URL'),
  ('announcement_bar',  '""', 'appearance', true, 'Short announcement shown in the top bar (empty = hidden)')

ON CONFLICT (setting_key) DO UPDATE
  SET
    setting_value = EXCLUDED.setting_value,
    category      = EXCLUDED.category,
    is_public     = EXCLUDED.is_public,
    description   = EXCLUDED.description,
    updated_at    = now();


-- =============================================================================
-- 2. CATEGORIES
-- (unique key: slug)
-- NOTE: table column is "sort_order", not "display_order"
-- =============================================================================
INSERT INTO public.categories (name, slug, description, is_active, sort_order)
VALUES
  ('Attars',         'attars',        'Pure concentrated perfume oils — the heart of our collection.',  true, 1),
  ('Oud & Agarwood', 'oud-agarwood',  'Rich, woody fragrances derived from the oud tree.',             true, 2),
  ('Floral',         'floral',        'Light and romantic floral attars for everyday wear.',            true, 3),
  ('Musky',          'musky',         'Warm, sensual musk blends.',                                    true, 4),
  ('Citrus & Fresh', 'citrus-fresh',  'Refreshing citrus and aquatic attars.',                         true, 5),
  ('Rose',           'rose',          'Iconic Damask and Taif rose attars.',                           true, 6),
  ('Amber & Resin',  'amber-resin',   'Deep, resinous amber blends with long-lasting sillage.',        true, 7),
  ('Gift Sets',      'gift-sets',     'Curated gift sets — perfect for weddings and celebrations.',    true, 8),
  ('New Arrivals',   'new-arrivals',  'The latest additions to our collection.',                       true, 9),
  ('Best Sellers',   'best-sellers',  'Our most loved fragrances chosen by customers.',                true, 10)

ON CONFLICT (slug) DO UPDATE
  SET
    name       = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active  = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();


-- =============================================================================
-- 3. BUSINESS HOURS
-- (unique key: day_of_week)
-- NOTE: table column is "is_open" (not "is_closed"), no "day_name" column.
-- day_of_week: 0 = Sunday … 6 = Saturday
-- =============================================================================
INSERT INTO public.business_hours (day_of_week, open_time, close_time, is_open, is_24_hours)
VALUES
  (0, '10:00', '18:00', false, false),   -- Sunday   — closed
  (1, '09:00', '20:00', true,  false),   -- Monday
  (2, '09:00', '20:00', true,  false),   -- Tuesday
  (3, '09:00', '20:00', true,  false),   -- Wednesday
  (4, '09:00', '20:00', true,  false),   -- Thursday
  (5, '09:00', '20:00', true,  false),   -- Friday
  (6, '10:00', '18:00', true,  false)    -- Saturday

ON CONFLICT (day_of_week) DO UPDATE
  SET
    open_time   = EXCLUDED.open_time,
    close_time  = EXCLUDED.close_time,
    is_open     = EXCLUDED.is_open,
    is_24_hours = EXCLUDED.is_24_hours,
    updated_at  = now();


-- =============================================================================
-- 4. CONTACT INFORMATION
-- (no unique key besides PK — use DO block to prevent duplicates on re-run)
-- NOTE: table columns are contact_type, label, value, is_primary, is_active, display_order
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contact_information LIMIT 1) THEN
    INSERT INTO public.contact_information
      (contact_type, label, value, is_primary, is_active, display_order)
    VALUES
      ('email',   'General Enquiries', 'info@orufy.com',      true,  true, 1),
      ('email',   'Support',           'support@orufy.com',   false, true, 2),
      ('phone',   'WhatsApp / Call',   '+91 00000 00000',            true,  true, 3),
      ('address', 'Store Address',     'Aligarh, Uttar Pradesh, India', true, true, 4);
  END IF;
END $$;


-- =============================================================================
-- 5. SOCIAL MEDIA ACCOUNTS
-- (no unique key besides PK — use DO block to prevent duplicates on re-run)
-- NOTE: table columns are platform, platform_name, url (not display_name / profile_url)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.social_media_accounts LIMIT 1) THEN
    INSERT INTO public.social_media_accounts
      (platform, platform_name, url, is_active, display_order)
    VALUES
      ('instagram', 'Instagram', 'https://instagram.com/orufy', true,  1),
      ('facebook',  'Facebook',  'https://facebook.com/orufy',  true,  2),
      ('whatsapp',  'WhatsApp',  'https://wa.me/910000000000',         true,  3),
      ('youtube',   'YouTube',   'https://youtube.com/@orufy',  false, 4);
  END IF;
END $$;


-- =============================================================================
-- 6. FOOTER LINKS
-- (no unique key besides PK — use DO block to prevent duplicates on re-run)
-- NOTE: table columns are link_text, link_url, opens_new_tab (not label/url/opens_in_new_tab)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.footer_links LIMIT 1) THEN
    INSERT INTO public.footer_links (section_name, link_text, link_url, is_active, display_order, opens_new_tab)
    VALUES
      -- Quick links
      ('Quick Links', 'Home',         '/',             true, 1, false),
      ('Quick Links', 'Products',     '/products',     true, 2, false),
      ('Quick Links', 'New Arrivals', '/new-arrivals', true, 3, false),
      ('Quick Links', 'Deals',        '/deals',        true, 4, false),
      ('Quick Links', 'About Us',     '/about',        true, 5, false),
      ('Quick Links', 'Contact Us',   '/contact',      true, 6, false),

      -- Customer support
      ('Support', 'My Account',     '/dashboard',        true, 1, false),
      ('Support', 'Track My Order', '/dashboard/orders', true, 2, false),
      ('Support', 'Wishlist',       '/wishlist',         true, 3, false),

      -- Legal
      ('Legal', 'Privacy Policy',  '/privacy-policy',   true, 1, false),
      ('Legal', 'Terms of Service','/terms-of-service', true, 2, false),
      ('Legal', 'Refund Policy',   '/refund-policy',    true, 3, false),
      ('Legal', 'Shipping Policy', '/shipping-policy',  true, 4, false);
  END IF;
END $$;
