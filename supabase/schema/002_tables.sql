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
