-- =============================================================================
-- 000_extensions.sql
-- PostgreSQL extensions required by this schema.
-- Safe to re-run on any platform (CREATE EXTENSION IF NOT EXISTS).
-- Run this FIRST before any other script.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- fast ILIKE / trigram search
CREATE EXTENSION IF NOT EXISTS "unaccent";    -- accent-insensitive search
-- =============================================================================
-- 002_tables.sql
-- Complete table definitions for all 22 application tables.
-- • Uses CREATE TABLE IF NOT EXISTS — safe on existing databases.
-- • Every column that was NOT NULL in production is kept NOT NULL.
-- • All foreign keys, CHECK constraints, and defaults are included.
-- • Dependency order: profiles → categories → products → everything else.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- One row per auth user. Created automatically by trigger on_auth_user_created.
-- password_hash is a legacy column kept for schema compatibility; actual auth
-- is handled by Supabase Auth / auth.users, not this column.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    uuid        NOT NULL DEFAULT uuid_generate_v4(),
  email                 text        NOT NULL,
  password_hash         text        NOT NULL DEFAULT '',  -- legacy; auth via auth.users
  full_name             text,
  avatar_url            text,
  role                  text                 DEFAULT 'customer',
  phone                 text,
  date_of_birth         date,
  gender                text,
  is_active             boolean              DEFAULT true  NOT NULL,
  email_verified        boolean              DEFAULT false NOT NULL,
  business_name         text,
  business_address      text,
  business_phone        text,
  tax_id                text,
  preferred_language    text                 DEFAULT 'en' NOT NULL,
  newsletter_subscribed boolean              DEFAULT false NOT NULL,
  created_at            timestamptz          DEFAULT now(),
  updated_at            timestamptz          DEFAULT now(),

  CONSTRAINT profiles_pkey            PRIMARY KEY (id),
  CONSTRAINT profiles_email_key       UNIQUE (email),
  CONSTRAINT profiles_role_check      CHECK (role IN ('customer','seller','admin')),
  CONSTRAINT profiles_gender_check    CHECK (gender IN ('male','female','other','prefer_not_to_say') OR gender IS NULL)
);

-- Ensure password_hash can never break future signups
ALTER TABLE public.profiles
  ALTER COLUMN password_hash SET DEFAULT '';

-- ─────────────────────────────────────────────────────────────────────────────
-- CATEGORIES
-- Supports nested categories via self-referencing parent_id.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid        NOT NULL DEFAULT uuid_generate_v4(),
  name        text        NOT NULL,
  slug        text        NOT NULL,
  description text,
  image_url   text,
  parent_id   uuid,
  sort_order  integer              DEFAULT 0  NOT NULL,
  is_active   boolean              DEFAULT true NOT NULL,
  created_at  timestamptz          DEFAULT now(),
  updated_at  timestamptz          DEFAULT now(),

  CONSTRAINT categories_pkey      PRIMARY KEY (id),
  CONSTRAINT categories_slug_key  UNIQUE (slug),
  CONSTRAINT categories_parent_fk FOREIGN KEY (parent_id)
    REFERENCES public.categories(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTS
-- Attar / perfume focused fields included alongside generic e-commerce fields.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id                uuid        NOT NULL DEFAULT uuid_generate_v4(),
  name              text        NOT NULL,
  slug              text        UNIQUE,
  description       text,
  short_description text,
  price             numeric(12,2) NOT NULL,
  original_price    numeric(12,2),
  category_id       uuid,
  seller_id         uuid,
  images            text[],
  stock             integer              DEFAULT 0  NOT NULL,
  min_stock_level   integer              DEFAULT 5  NOT NULL,
  sku               text        UNIQUE,
  weight            numeric(8,3),
  dimensions        jsonb,                           -- {"length":x,"width":y,"height":z,"unit":"cm"}
  tags              text[],
  specifications    jsonb,
  rating            numeric(3,2)         DEFAULT 0.00 NOT NULL,
  review_count      integer              DEFAULT 0    NOT NULL,
  is_featured       boolean              DEFAULT false NOT NULL,
  show_on_homepage  boolean              DEFAULT true  NOT NULL,
  is_active         boolean              DEFAULT true  NOT NULL,
  meta_title        text,
  meta_description  text,
  -- Attar / fragrance specific
  scent_notes       text[],
  longevity         text,
  sillage           text,
  fragrance_family  text,
  gender_profile    text,
  occasion          text[],
  season            text[],
  perfumer_story    text,
  origin            text,
  grade             text,
  packaging_options text[],
  shelf_life        text,
  certifications    text[],
  usage_tips        text,
  culinary_uses     text[],
  health_benefits   text[],
  created_at        timestamptz          DEFAULT now(),
  updated_at        timestamptz          DEFAULT now(),

  CONSTRAINT products_pkey          PRIMARY KEY (id),
  CONSTRAINT products_price_check   CHECK (price >= 0),
  CONSTRAINT products_stock_check   CHECK (stock >= 0),
  CONSTRAINT products_rating_check  CHECK (rating BETWEEN 0 AND 5),
  CONSTRAINT products_category_fk   FOREIGN KEY (category_id)
    REFERENCES public.categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT products_seller_fk     FOREIGN KEY (seller_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCT_VARIANTS
-- Size / volume / packaging variants of a product.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_variants (
  id          uuid          NOT NULL DEFAULT uuid_generate_v4(),
  product_id  uuid          NOT NULL,
  name        text          NOT NULL,
  sku         text          UNIQUE,
  price       numeric(12,2),
  stock       integer                DEFAULT 0 NOT NULL,
  attributes  jsonb,                               -- {"size":"10ml","color":"amber"}
  created_at  timestamptz            DEFAULT now(),
  updated_at  timestamptz            DEFAULT now(),

  CONSTRAINT product_variants_pkey       PRIMARY KEY (id),
  CONSTRAINT product_variants_stock_check CHECK (stock >= 0),
  CONSTRAINT product_variants_product_fk FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ADDRESSES
-- Shipping / billing addresses owned by a user.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id             uuid    NOT NULL DEFAULT uuid_generate_v4(),
  user_id        uuid    NOT NULL,
  type           text             DEFAULT 'home',
  full_name      text    NOT NULL,
  phone          text,
  street_address text    NOT NULL,
  city           text    NOT NULL,
  state          text,
  postal_code    text    NOT NULL,
  country        text    NOT NULL DEFAULT 'India',
  is_default     boolean          DEFAULT false NOT NULL,
  created_at     timestamptz      DEFAULT now(),
  updated_at     timestamptz      DEFAULT now(),

  CONSTRAINT addresses_pkey    PRIMARY KEY (id),
  CONSTRAINT addresses_type_check CHECK (type IN ('home','work','other')),
  CONSTRAINT addresses_user_fk FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- CART_ITEMS
-- One row per (user, product, variant) combination.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4(),
  user_id     uuid    NOT NULL,
  product_id  uuid    NOT NULL,
  variant_id  uuid,
  quantity    integer          DEFAULT 1 NOT NULL,
  created_at  timestamptz      DEFAULT now(),
  updated_at  timestamptz      DEFAULT now(),

  CONSTRAINT cart_items_pkey               PRIMARY KEY (id),
  CONSTRAINT cart_items_quantity_check     CHECK (quantity > 0),
  CONSTRAINT cart_items_unique             UNIQUE (user_id, product_id, variant_id),
  CONSTRAINT cart_items_user_fk           FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT cart_items_product_fk        FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT cart_items_variant_fk        FOREIGN KEY (variant_id)
    REFERENCES public.product_variants(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- WISHLIST_ITEMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL,
  product_id  uuid NOT NULL,
  created_at  timestamptz  DEFAULT now(),

  CONSTRAINT wishlist_items_pkey       PRIMARY KEY (id),
  CONSTRAINT wishlist_items_unique     UNIQUE (user_id, product_id),
  CONSTRAINT wishlist_items_user_fk    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT wishlist_items_product_fk FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDERS
-- Supports both authenticated and guest checkout.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                      uuid          NOT NULL DEFAULT uuid_generate_v4(),
  order_number            text          NOT NULL,
  user_id                 uuid,                                -- NULL = guest order
  guest_email             text,
  guest_name              text,
  subtotal                numeric(12,2) NOT NULL,
  tax_amount              numeric(12,2)            DEFAULT 0.00 NOT NULL,
  shipping_amount         numeric(12,2)            DEFAULT 0.00 NOT NULL,
  discount_amount         numeric(12,2)            DEFAULT 0.00 NOT NULL,
  total_amount            numeric(12,2) NOT NULL,
  status                  text                     DEFAULT 'pending' NOT NULL,
  payment_status          text                     DEFAULT 'pending' NOT NULL,
  payment_method          text,
  payment_id              text,
  shipping_address        jsonb,
  billing_address         jsonb,
  notes                   text,
  tracking_number         text,
  shipped_at              timestamptz,
  delivered_at            timestamptz,
  razorpay_order_id       text,
  razorpay_payment_id     text,
  payment_method_details  jsonb,
  created_at              timestamptz              DEFAULT now(),
  updated_at              timestamptz              DEFAULT now(),

  CONSTRAINT orders_pkey                PRIMARY KEY (id),
  CONSTRAINT orders_order_number_key    UNIQUE (order_number),
  CONSTRAINT orders_total_check         CHECK (total_amount >= 0),
  CONSTRAINT orders_status_check        CHECK (status IN (
    'pending','confirmed','processing','shipped','delivered','cancelled','refunded'
  )),
  CONSTRAINT orders_payment_status_check CHECK (payment_status IN (
    'pending','paid','failed','refunded','partially_refunded'
  )),
  -- Either user_id or guest_email must be present
  CONSTRAINT orders_user_or_guest       CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL),
  CONSTRAINT orders_user_fk            FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDER_ITEMS
-- Snapshot of product data at purchase time (product_snapshot).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id               uuid          NOT NULL DEFAULT uuid_generate_v4(),
  order_id         uuid          NOT NULL,
  product_id       uuid          NOT NULL,
  variant_id       uuid,
  quantity         integer       NOT NULL,
  unit_price       numeric(12,2) NOT NULL,
  total_price      numeric(12,2) NOT NULL,
  product_snapshot jsonb,
  created_at       timestamptz             DEFAULT now(),

  CONSTRAINT order_items_pkey           PRIMARY KEY (id),
  CONSTRAINT order_items_qty_check      CHECK (quantity > 0),
  CONSTRAINT order_items_price_check    CHECK (unit_price >= 0),
  CONSTRAINT order_items_order_fk       FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT order_items_product_fk     FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT order_items_variant_fk     FOREIGN KEY (variant_id)
    REFERENCES public.product_variants(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDER_TRACKING
-- Timeline of status updates for an order.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id    uuid NOT NULL,
  status      text NOT NULL,
  message     text,
  location    text,
  metadata    jsonb,
  created_by  uuid,
  created_at  timestamptz  DEFAULT now(),
  updated_at  timestamptz  DEFAULT now(),

  CONSTRAINT order_tracking_pkey      PRIMARY KEY (id),
  CONSTRAINT order_tracking_order_fk  FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT order_tracking_by_fk     FOREIGN KEY (created_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYMENT_LOGS
-- Immutable audit log of every payment event (Razorpay webhooks, etc.).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id                   uuid          NOT NULL DEFAULT uuid_generate_v4(),
  order_id             uuid          NOT NULL,
  razorpay_payment_id  text,
  razorpay_order_id    text,
  event_type           text          NOT NULL,
  status               text,
  amount               numeric(12,2),
  currency             text                   DEFAULT 'INR' NOT NULL,
  error_message        text,
  metadata             jsonb,
  created_at           timestamptz            DEFAULT now(),

  CONSTRAINT payment_logs_pkey     PRIMARY KEY (id),
  CONSTRAINT payment_logs_order_fk FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PAYMENT_METHODS
-- Saved payment methods for a user.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id               uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL,
  type             text NOT NULL,
  last_four        text,
  card_brand       text,
  expiry_month     text,
  expiry_year      text,
  cardholder_name  text,
  upi_id           text,
  billing_address  jsonb,
  is_default       boolean        DEFAULT false NOT NULL,
  is_active        boolean        DEFAULT true  NOT NULL,
  created_at       timestamptz    DEFAULT now(),
  updated_at       timestamptz    DEFAULT now(),

  CONSTRAINT payment_methods_pkey      PRIMARY KEY (id),
  CONSTRAINT payment_methods_type_check CHECK (type IN ('card','upi','netbanking','wallet','cod')),
  CONSTRAINT payment_methods_user_fk   FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- REVIEWS
-- Product reviews. Rating auto-synced to products via trigger.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id                   uuid    NOT NULL DEFAULT uuid_generate_v4(),
  product_id           uuid    NOT NULL,
  user_id              uuid    NOT NULL,
  rating               integer NOT NULL,
  title                text,
  comment              text,
  images               text[],
  is_verified_purchase boolean          DEFAULT false NOT NULL,
  is_approved          boolean          DEFAULT true  NOT NULL,
  helpful_count        integer          DEFAULT 0     NOT NULL,
  created_at           timestamptz      DEFAULT now(),
  updated_at           timestamptz      DEFAULT now(),

  CONSTRAINT reviews_pkey          PRIMARY KEY (id),
  CONSTRAINT reviews_rating_check  CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_one_per_user  UNIQUE (product_id, user_id),   -- one review per user per product
  CONSTRAINT reviews_product_fk    FOREIGN KEY (product_id)
    REFERENCES public.products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT reviews_user_fk       FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATION_PREFERENCES
-- One row per user, created on signup.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                   uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id              uuid NOT NULL,
  email_notifications  boolean        DEFAULT true  NOT NULL,
  sms_notifications    boolean        DEFAULT false NOT NULL,
  push_notifications   boolean        DEFAULT true  NOT NULL,
  order_updates        boolean        DEFAULT true  NOT NULL,
  promotional_emails   boolean        DEFAULT false NOT NULL,
  newsletter           boolean        DEFAULT true  NOT NULL,
  product_updates      boolean        DEFAULT true  NOT NULL,
  price_alerts         boolean        DEFAULT false NOT NULL,
  created_at           timestamptz    DEFAULT now(),
  updated_at           timestamptz    DEFAULT now(),

  CONSTRAINT notification_preferences_pkey    PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_uk UNIQUE (user_id),
  CONSTRAINT notification_preferences_user_fk FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SITE_SETTINGS
-- Key-value store for site configuration. is_public = true means
-- anonymous users can read it (useful for site name, logo, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id            uuid               NOT NULL DEFAULT uuid_generate_v4(),
  setting_key   character varying  NOT NULL,
  setting_value text,
  setting_type  character varying           DEFAULT 'text',
  category      character varying           DEFAULT 'general',
  description   text,
  is_public     boolean                     DEFAULT false NOT NULL,
  updated_by    uuid,
  created_at    timestamptz                 DEFAULT now(),
  updated_at    timestamptz                 DEFAULT now(),

  CONSTRAINT site_settings_pkey        PRIMARY KEY (id),
  CONSTRAINT site_settings_key_uk      UNIQUE (setting_key),
  CONSTRAINT site_settings_updated_fk  FOREIGN KEY (updated_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN_DASHBOARD_SETTINGS
-- Admin-only configuration (widget visibility, dashboard preferences, etc.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_dashboard_settings (
  id            uuid               NOT NULL DEFAULT gen_random_uuid(),
  setting_key   character varying  NOT NULL,
  setting_value text,
  setting_type  character varying           DEFAULT 'text',
  category      character varying           DEFAULT 'dashboard',
  description   text,
  is_active     boolean                     DEFAULT true NOT NULL,
  updated_by    uuid,
  created_at    timestamptz                 DEFAULT CURRENT_TIMESTAMP,
  updated_at    timestamptz                 DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT admin_settings_pkey      PRIMARY KEY (id),
  CONSTRAINT admin_settings_key_uk    UNIQUE (setting_key),
  CONSTRAINT admin_settings_by_fk     FOREIGN KEY (updated_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- BUSINESS_HOURS
-- One row per day of week (0 = Sunday … 6 = Saturday).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_hours (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4(),
  day_of_week integer NOT NULL,
  is_open     boolean          DEFAULT true  NOT NULL,
  open_time   time,
  close_time  time,
  is_24_hours boolean          DEFAULT false NOT NULL,
  notes       text,
  created_at  timestamptz      DEFAULT now(),
  updated_at  timestamptz      DEFAULT now(),

  CONSTRAINT business_hours_pkey         PRIMARY KEY (id),
  CONSTRAINT business_hours_day_uk       UNIQUE (day_of_week),
  CONSTRAINT business_hours_day_check    CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT business_hours_time_check   CHECK (
    is_24_hours = true OR (open_time IS NOT NULL AND close_time IS NOT NULL) OR is_open = false
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTACT_INFORMATION
-- Store phone numbers, emails, addresses shown on the contact page.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_information (
  id              uuid               NOT NULL DEFAULT uuid_generate_v4(),
  contact_type    character varying  NOT NULL,
  label           character varying  NOT NULL,
  value           text               NOT NULL,
  is_primary      boolean                     DEFAULT false NOT NULL,
  is_active       boolean                     DEFAULT true  NOT NULL,
  display_order   integer                     DEFAULT 0     NOT NULL,
  icon_name       character varying,
  additional_info jsonb,
  created_at      timestamptz                 DEFAULT now(),
  updated_at      timestamptz                 DEFAULT now(),

  CONSTRAINT contact_information_pkey       PRIMARY KEY (id),
  CONSTRAINT contact_information_type_check CHECK (
    contact_type IN ('phone','email','address','whatsapp','website','other')
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SOCIAL_MEDIA_ACCOUNTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id             uuid               NOT NULL DEFAULT uuid_generate_v4(),
  platform       character varying  NOT NULL,
  platform_name  character varying  NOT NULL,
  url            text               NOT NULL,
  username       character varying,
  icon_name      character varying,
  is_active      boolean                     DEFAULT true NOT NULL,
  display_order  integer                     DEFAULT 0    NOT NULL,
  follower_count integer                     DEFAULT 0    NOT NULL,
  description    text,
  created_at     timestamptz                 DEFAULT now(),
  updated_at     timestamptz                 DEFAULT now(),

  CONSTRAINT social_media_pkey          PRIMARY KEY (id),
  CONSTRAINT social_media_platform_check CHECK (
    platform IN ('instagram','facebook','youtube','twitter','x','whatsapp','tiktok','pinterest','linkedin','other')
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- FOOTER_LINKS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.footer_links (
  id            uuid               NOT NULL DEFAULT uuid_generate_v4(),
  section_name  character varying  NOT NULL,
  link_text     character varying  NOT NULL,
  link_url      character varying  NOT NULL,
  display_order integer                     DEFAULT 0     NOT NULL,
  is_active     boolean                     DEFAULT true  NOT NULL,
  opens_new_tab boolean                     DEFAULT false NOT NULL,
  created_at    timestamptz                 DEFAULT now(),
  updated_at    timestamptz                 DEFAULT now(),

  CONSTRAINT footer_links_pkey PRIMARY KEY (id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTACT_SUBMISSIONS
-- Contact form submissions. Anonymous (guest) submissions allowed.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text          DEFAULT 'new' NOT NULL,
  user_id     uuid,
  admin_notes text,
  replied_at  timestamptz,
  replied_by  uuid,
  created_at  timestamptz   DEFAULT now(),
  updated_at  timestamptz   DEFAULT now(),

  CONSTRAINT contact_submissions_pkey         PRIMARY KEY (id),
  CONSTRAINT contact_submissions_status_check CHECK (status IN ('new','read','replied','archived')),
  CONSTRAINT contact_submissions_user_fk      FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT contact_submissions_replied_fk   FOREIGN KEY (replied_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- UPLOADED_FILES
-- File metadata and content (base64 or storage path in file_data).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4(),
  filename    text    NOT NULL,
  folder      text    NOT NULL DEFAULT 'uploads',
  mime_type   text    NOT NULL,
  file_size   integer NOT NULL,
  file_data   text    NOT NULL,
  url_path    text    NOT NULL,
  uploaded_by uuid,
  created_at  timestamptz      DEFAULT now(),
  updated_at  timestamptz      DEFAULT now(),

  CONSTRAINT uploaded_files_pkey       PRIMARY KEY (id),
  CONSTRAINT uploaded_files_size_check CHECK (file_size > 0),
  CONSTRAINT uploaded_files_by_fk      FOREIGN KEY (uploaded_by)
    REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE
);
-- =============================================================================
-- 003_indexes.sql
-- Performance indexes for all 22 tables
--
-- Safe to re-run: uses CREATE INDEX IF NOT EXISTS throughout.
-- Run AFTER 002_tables.sql.
-- =============================================================================

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_email  ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role   ON public.profiles (role);

-- ── categories ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_slug      ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active    ON public.categories (is_active);

-- ── products ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_slug        ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id   ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products (is_featured)    WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_homepage    ON public.products (show_on_homepage) WHERE show_on_homepage = true;
-- Full-text search on name + description (trigram support via pg_trgm)
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products
  USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')));

-- ── product_variants ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants (product_id);

-- ── addresses ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);

-- ── cart_items ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id    ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items (product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items (variant_id);
-- The UNIQUE constraint on (user_id, product_id, variant_id) in the table definition
-- treats NULL != NULL, so two rows with variant_id = NULL for the same user+product
-- would not be caught. This partial index closes that gap.
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_unique_no_variant
  ON public.cart_items (user_id, product_id)
  WHERE variant_id IS NULL;

-- ── wishlist_items ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id    ON public.wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items (product_id);

-- ── orders ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id                ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                 ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status         ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at             ON public.orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id      ON public.orders (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id    ON public.orders (razorpay_payment_id);
-- Composite: common query pattern for user order history filtered by payment status
CREATE INDEX IF NOT EXISTS idx_orders_user_id_payment_status ON public.orders (user_id, payment_status);

-- ── order_items ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items (variant_id);

-- ── order_tracking ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id   ON public.order_tracking (order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status     ON public.order_tracking (status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking (created_at);

-- ── payment_logs ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id            ON public.payment_logs (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_razorpay_payment_id ON public.payment_logs (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type          ON public.payment_logs (event_type);

-- ── payment_methods ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods (user_id);

-- ── reviews ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id    ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved   ON public.reviews (is_approved) WHERE is_approved = true;

-- ── notification_preferences ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences (user_id);

-- ── site_settings ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_site_settings_key      ON public.site_settings (setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON public.site_settings (category);
CREATE INDEX IF NOT EXISTS idx_site_settings_public   ON public.site_settings (is_public) WHERE is_public = true;

-- ── admin_dashboard_settings ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_dashboard_settings (setting_key);

-- ── business_hours ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON public.business_hours (day_of_week);

-- ── contact_information ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contact_info_type ON public.contact_information (contact_type, is_active);

-- ── social_media_accounts ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_media_active ON public.social_media_accounts (is_active, display_order);

-- ── footer_links ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_footer_links_section ON public.footer_links (section_name, display_order);

-- ── contact_submissions ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status     ON public.contact_submissions (status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email      ON public.contact_submissions (email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id    ON public.contact_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions (created_at);

-- ── uploaded_files ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_uploaded_files_folder      ON public.uploaded_files (folder);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON public.uploaded_files (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_url_path    ON public.uploaded_files (url_path);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at  ON public.uploaded_files (created_at DESC);
-- =============================================================================
-- 004_functions.sql
-- Helper functions used by RLS policies and triggers
--
-- All functions use:
--   SECURITY DEFINER  — run as owner, bypasses RLS to avoid recursion
--   SET search_path   — explicit schema prevents privilege-escalation via
--                       a malicious function injected into search_path
--
-- Safe to re-run: uses CREATE OR REPLACE throughout.
-- Run AFTER 002_tables.sql.
-- =============================================================================

-- ── Role helpers (used in RLS USING clauses) ──────────────────────────────────

-- Returns TRUE if the currently authenticated user has role = 'admin'.
-- SECURITY DEFINER so it reads profiles without triggering RLS on profiles itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Returns TRUE if the currently authenticated user has role IN ('admin','seller').
CREATE OR REPLACE FUNCTION public.is_admin_or_seller()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'seller')
  );
$$;

-- Returns the role text of the currently authenticated user ('customer', 'seller', 'admin').
-- Returns NULL when called by an unauthenticated session.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── Profile auto-creation (trigger function) ──────────────────────────────────
-- Called by the on_auth_user_created trigger on auth.users (see 005_triggers.sql).
-- SECURITY DEFINER bypasses RLS so the INSERT into profiles always succeeds even
-- before the user's own RLS policy kicks in.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    password_hash,         -- empty string; passwords are managed by Supabase Auth
    full_name,
    role,
    is_active,
    preferred_language,
    newsletter_subscribed
  )
  VALUES (
    NEW.id,
    NEW.email,
    '',
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    true,
    'en',
    false
  )
  ON CONFLICT (id) DO NOTHING;   -- idempotent: skip if profile already exists
  RETURN NEW;
END;
$$;

-- ── updated_at auto-maintenance ───────────────────────────────────────────────
-- Attach to any table with an updated_at column via a BEFORE UPDATE trigger
-- (see 005_triggers.sql).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Product rating aggregator (trigger function) ──────────────────────────────
-- Fired AFTER INSERT / UPDATE / DELETE on reviews.
-- Recalculates products.rating (avg of approved reviews, rounded to 2 decimals)
-- and products.review_count in a single UPDATE to avoid stale counts.
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
BEGIN
  -- Works for INSERT/UPDATE (NEW) and DELETE (OLD)
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE public.products
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE product_id = v_product_id AND is_approved = true
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE product_id = v_product_id AND is_approved = true
    ),
    updated_at = now()
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── Profile upsert bypass (called from frontend via .rpc()) ──────────────────
-- Creates a profile row if one does not already exist.
-- SECURITY DEFINER bypasses RLS, so this works even for users whose profile
-- was never created by the trigger (pre-trigger signups, trigger failures, etc.)
-- Safe to call repeatedly — ON CONFLICT (id) DO NOTHING makes it idempotent.
--
-- Frontend usage:
--   supabase.rpc('ensure_profile_exists', {
--     p_user_id: user.id, p_email: user.email,
--     p_full_name: 'John', p_role: 'customer'
--   })
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(
  p_user_id   uuid,
  p_email     text,
  p_full_name text DEFAULT 'User',
  p_role      text DEFAULT 'customer'
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, password_hash, full_name, role,
    is_active, preferred_language, newsletter_subscribed
  )
  VALUES (
    p_user_id,
    p_email,
    '',
    COALESCE(NULLIF(trim(p_full_name), ''), 'User'),
    COALESCE(NULLIF(p_role, ''), 'customer'),
    true,
    'en',
    false
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Only authenticated users can call this function.
-- (anon users should never be creating profiles via the API.)
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists TO authenticated;

-- ── Human-readable order number ───────────────────────────────────────────────
-- Generates order numbers in the format:  AA-YYYYMMDD-NNNN
--   AA   = site prefix (orufy)
--   YYYYMMDD = date of the order
--   NNNN = daily sequence, zero-padded to 4 digits
--
-- Usage: called from application code or a trigger on orders.
-- Example result: AA-20260320-0042
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date   text := to_char(now(), 'YYYYMMDD');
  v_count  int;
  v_number text;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.orders
  WHERE created_at >= date_trunc('day', now());

  v_number := 'AA-' || v_date || '-' || lpad(v_count::text, 4, '0');
  RETURN v_number;
END;
$$;
-- =============================================================================
-- 005_triggers.sql
-- All database triggers
--
-- Safe to re-run: DROP TRIGGER IF EXISTS before every CREATE TRIGGER.
-- Run AFTER 004_functions.sql.
-- =============================================================================

-- ── Auth: auto-create a profile row on every new signup ───────────────────────
-- Fires on auth.users so it works with both Supabase Auth and the plain-Postgres
-- auth.create_user() helper from 001_auth_compat.sql.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── updated_at: auto-stamp the timestamp on every row update ─────────────────
-- Applied to every table that has an updated_at column.

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.categories;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.products;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.product_variants;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.addresses;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.cart_items;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.orders;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.order_tracking;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.order_tracking
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.payment_methods;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.reviews;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.notification_preferences;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.site_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.admin_dashboard_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.admin_dashboard_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.business_hours;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.business_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.contact_information;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contact_information
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.social_media_accounts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.footer_links;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.footer_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.contact_submissions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.uploaded_files;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.uploaded_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Reviews: keep products.rating and products.review_count in sync ───────────
-- Fires after any INSERT, UPDATE, or DELETE on reviews so the aggregates are
-- always current without needing a manual recalculation job.
DROP TRIGGER IF EXISTS update_product_rating_on_review ON public.reviews;
CREATE TRIGGER update_product_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();
-- =============================================================================
-- 006_rls_policies.sql
-- Production-ready Row Level Security for all 22 tables
--
-- Security model:
--   anon          — unauthenticated visitors
--   authenticated — any logged-in user (Supabase sets this automatically)
--   is_admin()    — SECURITY DEFINER helper → avoids RLS recursion on profiles
--   is_admin_or_seller() — SECURITY DEFINER helper
--
-- Safe to re-run: DROP POLICY IF EXISTS before every CREATE POLICY.
-- Run AFTER 004_functions.sql (is_admin / is_admin_or_seller must exist).
-- =============================================================================


-- =============================================================================
-- 1. PROFILES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: users read own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: users update own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: users insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin read all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update all" ON public.profiles;

-- Users read their own profile row
CREATE POLICY "profiles: users read own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- Users update their own profile; they cannot self-elevate their role.
-- Uses public.current_user_role() (SECURITY DEFINER) instead of a subquery on
-- profiles to avoid RLS self-recursion on this table.
CREATE POLICY "profiles: users update own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = public.current_user_role()
  );

-- Users insert their own profile (fallback — handle_new_user() trigger does this normally)
CREATE POLICY "profiles: users insert own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Admins read every profile
CREATE POLICY "profiles: admin read all" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

-- Admins can update any profile (including role promotions / bans)
CREATE POLICY "profiles: admin update all" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin());


-- =============================================================================
-- 2. CATEGORIES
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories: public read active" ON public.categories;
DROP POLICY IF EXISTS "categories: admin all"          ON public.categories;

-- Anyone (even guests) can read active categories
CREATE POLICY "categories: public read active" ON public.categories
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Admins have full CRUD
CREATE POLICY "categories: admin all" ON public.categories
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 3. PRODUCTS
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products: public read active"  ON public.products;
DROP POLICY IF EXISTS "products: seller manage own"   ON public.products;
DROP POLICY IF EXISTS "products: admin all"           ON public.products;

-- Anyone can browse active products
CREATE POLICY "products: public read active" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Sellers manage only their own products
CREATE POLICY "products: seller manage own" ON public.products
  FOR ALL TO authenticated
  USING    (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Admins have full access (including inactive products)
CREATE POLICY "products: admin all" ON public.products
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 4. PRODUCT_VARIANTS
-- =============================================================================
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variants: public read"       ON public.product_variants;
DROP POLICY IF EXISTS "variants: seller manage own" ON public.product_variants;
DROP POLICY IF EXISTS "variants: admin all"         ON public.product_variants;

-- Anyone can read variants
CREATE POLICY "variants: public read" ON public.product_variants
  FOR SELECT TO anon, authenticated USING (true);

-- Sellers manage variants of products they own
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
-- 5. ADDRESSES
-- =============================================================================
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses: users crud own" ON public.addresses;
DROP POLICY IF EXISTS "addresses: admin all"      ON public.addresses;

CREATE POLICY "addresses: users crud own" ON public.addresses
  FOR ALL TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "addresses: admin all" ON public.addresses
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 6. CART_ITEMS
-- =============================================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart: users crud own" ON public.cart_items;
DROP POLICY IF EXISTS "cart: admin all"      ON public.cart_items;

CREATE POLICY "cart: users crud own" ON public.cart_items
  FOR ALL TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cart: admin all" ON public.cart_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 7. WISHLIST_ITEMS
-- =============================================================================
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist: users crud own" ON public.wishlist_items;
DROP POLICY IF EXISTS "wishlist: admin all"      ON public.wishlist_items;

CREATE POLICY "wishlist: users crud own" ON public.wishlist_items
  FOR ALL TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlist: admin all" ON public.wishlist_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 8. ORDERS
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders: users read own"   ON public.orders;
DROP POLICY IF EXISTS "orders: users insert own" ON public.orders;
DROP POLICY IF EXISTS "orders: admin all"        ON public.orders;

-- Users see only their own orders
CREATE POLICY "orders: users read own" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Users can place orders (must supply their own user_id)
CREATE POLICY "orders: users insert own" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Admins and sellers have full access for fulfilment workflows
CREATE POLICY "orders: admin all" ON public.orders
  FOR ALL TO authenticated
  USING    (public.is_admin_or_seller())
  WITH CHECK (public.is_admin_or_seller());


-- =============================================================================
-- 9. ORDER_ITEMS
-- =============================================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items: users read own" ON public.order_items;
DROP POLICY IF EXISTS "order_items: users insert"   ON public.order_items;
DROP POLICY IF EXISTS "order_items: admin all"      ON public.order_items;

-- Users read items that belong to their own orders
CREATE POLICY "order_items: users read own" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Users insert items when creating an order
CREATE POLICY "order_items: users insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE POLICY "order_items: admin all" ON public.order_items
  FOR ALL TO authenticated
  USING    (public.is_admin_or_seller())
  WITH CHECK (public.is_admin_or_seller());


-- =============================================================================
-- 10. ORDER_TRACKING
-- =============================================================================
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking: users read own" ON public.order_tracking;
DROP POLICY IF EXISTS "tracking: admin all"      ON public.order_tracking;

-- Users can see tracking events for their own orders
CREATE POLICY "tracking: users read own" ON public.order_tracking
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Only admins / sellers write tracking events
CREATE POLICY "tracking: admin all" ON public.order_tracking
  FOR ALL TO authenticated
  USING    (public.is_admin_or_seller())
  WITH CHECK (public.is_admin_or_seller());


-- =============================================================================
-- 11. PAYMENT_LOGS
-- =============================================================================
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_logs: users read own" ON public.payment_logs;
DROP POLICY IF EXISTS "payment_logs: admin all"      ON public.payment_logs;

-- Users can view payment logs for their own orders
CREATE POLICY "payment_logs: users read own" ON public.payment_logs
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- Only admins write / manage payment logs
CREATE POLICY "payment_logs: admin all" ON public.payment_logs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 12. PAYMENT_METHODS
-- =============================================================================
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods: users crud own" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods: admin all"      ON public.payment_methods;

CREATE POLICY "payment_methods: users crud own" ON public.payment_methods
  FOR ALL TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment_methods: admin all" ON public.payment_methods
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 13. REVIEWS
-- =============================================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews: public read approved" ON public.reviews;
DROP POLICY IF EXISTS "reviews: users write own"      ON public.reviews;
DROP POLICY IF EXISTS "reviews: users update own"     ON public.reviews;
DROP POLICY IF EXISTS "reviews: users delete own"     ON public.reviews;
DROP POLICY IF EXISTS "reviews: admin all"            ON public.reviews;

-- Anyone can read approved reviews (used on product pages)
CREATE POLICY "reviews: public read approved" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_approved = true);

-- Logged-in users post reviews
CREATE POLICY "reviews: users write own" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Users edit their own reviews
CREATE POLICY "reviews: users update own" ON public.reviews
  FOR UPDATE TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users delete their own reviews
CREATE POLICY "reviews: users delete own" ON public.reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Admins manage all reviews, including approval of unapproved ones
CREATE POLICY "reviews: admin all" ON public.reviews
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 14. NOTIFICATION_PREFERENCES
-- =============================================================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_prefs: users crud own" ON public.notification_preferences;
DROP POLICY IF EXISTS "notif_prefs: admin all"      ON public.notification_preferences;

CREATE POLICY "notif_prefs: users crud own" ON public.notification_preferences
  FOR ALL TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notif_prefs: admin all" ON public.notification_preferences
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 15. SITE_SETTINGS
-- =============================================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings: public read public" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings: auth read all"      ON public.site_settings;
DROP POLICY IF EXISTS "site_settings: admin write"        ON public.site_settings;

-- Guests can read settings flagged is_public = true (site name, logo URL, etc.)
CREATE POLICY "site_settings: public read public" ON public.site_settings
  FOR SELECT TO anon USING (is_public = true);

-- Authenticated users can read all settings (needed for site configuration in app)
CREATE POLICY "site_settings: auth read all" ON public.site_settings
  FOR SELECT TO authenticated USING (true);

-- Only admins can create / update / delete settings
CREATE POLICY "site_settings: admin write" ON public.site_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 16. ADMIN_DASHBOARD_SETTINGS
-- =============================================================================
ALTER TABLE public.admin_dashboard_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings: admin all" ON public.admin_dashboard_settings;

-- Strictly admin-only — no public or user visibility
CREATE POLICY "admin_settings: admin all" ON public.admin_dashboard_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 17. BUSINESS_HOURS
-- =============================================================================
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_hours: public read" ON public.business_hours;
DROP POLICY IF EXISTS "business_hours: admin write" ON public.business_hours;

-- Anyone can read business hours (shown on contact/about pages)
CREATE POLICY "business_hours: public read" ON public.business_hours
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "business_hours: admin write" ON public.business_hours
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 18. CONTACT_INFORMATION
-- =============================================================================
ALTER TABLE public.contact_information ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_info: public read active" ON public.contact_information;
DROP POLICY IF EXISTS "contact_info: admin all"          ON public.contact_information;

-- Anyone can read active contact entries
CREATE POLICY "contact_info: public read active" ON public.contact_information
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "contact_info: admin all" ON public.contact_information
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 19. SOCIAL_MEDIA_ACCOUNTS
-- =============================================================================
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social: public read active" ON public.social_media_accounts;
DROP POLICY IF EXISTS "social: admin all"          ON public.social_media_accounts;

-- Anyone can read active social accounts (shown in footer / header)
CREATE POLICY "social: public read active" ON public.social_media_accounts
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "social: admin all" ON public.social_media_accounts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 20. FOOTER_LINKS
-- =============================================================================
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "footer: public read active" ON public.footer_links;
DROP POLICY IF EXISTS "footer: admin all"          ON public.footer_links;

-- Anyone can read active footer links
CREATE POLICY "footer: public read active" ON public.footer_links
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "footer: admin all" ON public.footer_links
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 21. CONTACT_SUBMISSIONS
-- =============================================================================
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_sub: anon insert"    ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_sub: users read own" ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_sub: admin all"      ON public.contact_submissions;

-- Anyone (including guests) can submit the contact form
CREATE POLICY "contact_sub: anon insert" ON public.contact_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Logged-in users can view their own past submissions
CREATE POLICY "contact_sub: users read own" ON public.contact_submissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admins can read, update status, and delete submissions
CREATE POLICY "contact_sub: admin all" ON public.contact_submissions
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- =============================================================================
-- 22. UPLOADED_FILES
-- =============================================================================
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uploads: anon read"       ON public.uploaded_files;
DROP POLICY IF EXISTS "uploads: auth read all"   ON public.uploaded_files;
DROP POLICY IF EXISTS "uploads: auth insert own" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploads: users delete own" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploads: admin all"        ON public.uploaded_files;

-- Public files (product images etc.) need to be readable by guests
CREATE POLICY "uploads: anon read" ON public.uploaded_files
  FOR SELECT TO anon USING (true);

-- Authenticated users can read all uploaded files
CREATE POLICY "uploads: auth read all" ON public.uploaded_files
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can upload files attributed to themselves
CREATE POLICY "uploads: auth insert own" ON public.uploaded_files
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

-- Users can delete only their own uploads
CREATE POLICY "uploads: users delete own" ON public.uploaded_files
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Admins can manage everything (bulk delete, folder management)
CREATE POLICY "uploads: admin all" ON public.uploaded_files
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
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
