-- =============================================================================
-- 001_tables.sql
-- Complete table definitions for all 22 public tables
-- Uses CREATE TABLE IF NOT EXISTS — safe for fresh installs
-- Existing databases: run 005_rls_policies.sql to fix security without
-- recreating tables.
-- =============================================================================

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Mirrors auth.users. A trigger auto-creates a row on signup.
-- password_hash is a legacy column; Supabase Auth owns actual auth.
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  email               text        NOT NULL,
  password_hash       text        NOT NULL DEFAULT '',   -- managed by Supabase Auth
  full_name           text,
  avatar_url          text,
  role                text                 DEFAULT 'customer',  -- customer | seller | admin
  phone               text,
  date_of_birth       date,
  gender              text,
  is_active           boolean              DEFAULT true,
  email_verified      boolean              DEFAULT false,
  business_name       text,
  business_address    text,
  business_phone      text,
  tax_id              text,
  preferred_language  text                 DEFAULT 'en',
  newsletter_subscribed boolean            DEFAULT false,
  created_at          timestamptz          DEFAULT now(),
  updated_at          timestamptz          DEFAULT now(),
  CONSTRAINT profiles_email_key UNIQUE (email),
  CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'seller', 'admin'))
);

-- ── categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text    NOT NULL,
  slug        text    NOT NULL,
  description text,
  image_url   text,
  parent_id   uuid    REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order  integer          DEFAULT 0,
  is_active   boolean          DEFAULT true,
  created_at  timestamptz      DEFAULT now(),
  updated_at  timestamptz      DEFAULT now(),
  CONSTRAINT categories_slug_key UNIQUE (slug)
);

-- ── products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id                  uuid      NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                text      NOT NULL,
  slug                text               UNIQUE,
  description         text,
  short_description   text,
  price               numeric   NOT NULL,
  original_price      numeric,
  category_id         uuid               REFERENCES public.categories(id) ON DELETE SET NULL,
  seller_id           uuid               REFERENCES public.profiles(id) ON DELETE SET NULL,
  images              text[],
  stock               integer            DEFAULT 0,
  min_stock_level     integer            DEFAULT 5,
  sku                 text               UNIQUE,
  weight              numeric,
  dimensions          jsonb,
  tags                text[],
  specifications      jsonb,
  rating              numeric            DEFAULT 0.00,
  review_count        integer            DEFAULT 0,
  is_featured         boolean            DEFAULT false,
  show_on_homepage    boolean            DEFAULT true,
  is_active           boolean            DEFAULT true,
  meta_title          text,
  meta_description    text,
  -- Attar / fragrance specific fields
  scent_notes         text[],
  longevity           text,
  sillage             text,
  fragrance_family    text,
  gender_profile      text,
  occasion            text[],
  season              text[],
  perfumer_story      text,
  origin              text,
  grade               text,
  packaging_options   text[],
  shelf_life          text,
  certifications      text[],
  usage_tips          text,
  culinary_uses       text[],
  health_benefits     text[],
  created_at          timestamptz        DEFAULT now(),
  updated_at          timestamptz        DEFAULT now()
);

-- ── product_variants ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_variants (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id  uuid    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name        text    NOT NULL,
  sku         text             UNIQUE,
  price       numeric,
  stock       integer          DEFAULT 0,
  attributes  jsonb,             -- e.g. {"size": "10ml", "color": "amber"}
  created_at  timestamptz      DEFAULT now(),
  updated_at  timestamptz      DEFAULT now()
);

-- ── addresses ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id             uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           text             DEFAULT 'home',  -- home | work | other
  full_name      text    NOT NULL,
  phone          text,
  street_address text    NOT NULL,
  city           text    NOT NULL,
  state          text,
  postal_code    text    NOT NULL,
  country        text    NOT NULL,
  is_default     boolean          DEFAULT false,
  created_at     timestamptz      DEFAULT now(),
  updated_at     timestamptz      DEFAULT now()
);

-- ── cart_items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  uuid    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id  uuid             REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity    integer NOT NULL DEFAULT 1,
  created_at  timestamptz      DEFAULT now(),
  updated_at  timestamptz      DEFAULT now(),
  CONSTRAINT cart_items_user_product_variant_key
    UNIQUE (user_id, product_id, variant_id)
);

-- ── wishlist_items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id          uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  timestamptz  DEFAULT now(),
  CONSTRAINT wishlist_items_user_product_key UNIQUE (user_id, product_id)
);

-- ── orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                      uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number            text    NOT NULL UNIQUE,
  user_id                 uuid             REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_email             text,
  guest_name              text,
  subtotal                numeric NOT NULL,
  tax_amount              numeric          DEFAULT 0.00,
  shipping_amount         numeric          DEFAULT 0.00,
  discount_amount         numeric          DEFAULT 0.00,
  total_amount            numeric NOT NULL,
  status                  text             DEFAULT 'pending',   -- pending|confirmed|processing|shipped|delivered|cancelled|refunded
  payment_status          text             DEFAULT 'pending',   -- pending|paid|failed|refunded
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
  created_at              timestamptz      DEFAULT now(),
  updated_at              timestamptz      DEFAULT now(),
  CONSTRAINT orders_status_check CHECK (
    status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')
  ),
  CONSTRAINT orders_payment_status_check CHECK (
    payment_status IN ('pending','paid','failed','refunded','partially_refunded')
  )
);

-- ── order_items ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id               uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id         uuid    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id       uuid    NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id       uuid             REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity         integer NOT NULL,
  unit_price       numeric NOT NULL,
  total_price      numeric NOT NULL,
  product_snapshot jsonb,            -- snapshot of product at time of purchase
  created_at       timestamptz      DEFAULT now()
);

-- ── order_tracking ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_tracking (
  id         uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     text NOT NULL,
  message    text,
  location   text,
  metadata   jsonb,
  created_by uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz   DEFAULT now(),
  updated_at timestamptz   DEFAULT now()
);

-- ── payment_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id                   uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id             uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  razorpay_payment_id  text,
  razorpay_order_id    text,
  event_type           text NOT NULL,  -- created|authorized|captured|failed|refunded
  status               text,
  amount               numeric,
  currency             text          DEFAULT 'INR',
  error_message        text,
  metadata             jsonb,
  created_at           timestamptz   DEFAULT now()
);

-- ── payment_methods ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id               uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type             text NOT NULL,   -- card | upi | netbanking | wallet
  last_four        text,
  card_brand       text,
  expiry_month     text,
  expiry_year      text,
  cardholder_name  text,
  upi_id           text,
  billing_address  jsonb,
  is_default       boolean         DEFAULT false,
  is_active        boolean         DEFAULT true,
  created_at       timestamptz     DEFAULT now(),
  updated_at       timestamptz     DEFAULT now()
);

-- ── reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id                  uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id          uuid    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id             uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating              integer NOT NULL,
  title               text,
  comment             text,
  images              text[],
  is_verified_purchase boolean          DEFAULT false,
  is_approved         boolean          DEFAULT true,
  helpful_count       integer          DEFAULT 0,
  created_at          timestamptz      DEFAULT now(),
  updated_at          timestamptz      DEFAULT now(),
  CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);

-- ── notification_preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                   uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id              uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications  boolean        DEFAULT true,
  sms_notifications    boolean        DEFAULT false,
  push_notifications   boolean        DEFAULT true,
  order_updates        boolean        DEFAULT true,
  promotional_emails   boolean        DEFAULT false,
  newsletter           boolean        DEFAULT true,
  product_updates      boolean        DEFAULT true,
  price_alerts         boolean        DEFAULT false,
  created_at           timestamptz    DEFAULT now(),
  updated_at           timestamptz    DEFAULT now()
);

-- ── site_settings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id            uuid               NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key   character varying  NOT NULL UNIQUE,
  setting_value text,
  setting_type  character varying           DEFAULT 'text',
  category      character varying           DEFAULT 'general',
  description   text,
  is_public     boolean                     DEFAULT false,
  updated_by    uuid               REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz                 DEFAULT now(),
  updated_at    timestamptz                 DEFAULT now()
);

-- ── admin_dashboard_settings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_dashboard_settings (
  id            uuid               NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key   character varying  NOT NULL UNIQUE,
  setting_value text,
  setting_type  character varying           DEFAULT 'text',
  category      character varying           DEFAULT 'dashboard',
  description   text,
  is_active     boolean                     DEFAULT true,
  updated_by    uuid               REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz                 DEFAULT CURRENT_TIMESTAMP,
  updated_at    timestamptz                 DEFAULT CURRENT_TIMESTAMP
);

-- ── business_hours ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_hours (
  id          uuid    NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_of_week integer NOT NULL UNIQUE,  -- 0=Sunday … 6=Saturday
  is_open     boolean          DEFAULT true,
  open_time   time,
  close_time  time,
  is_24_hours boolean          DEFAULT false,
  notes       text,
  created_at  timestamptz      DEFAULT now(),
  updated_at  timestamptz      DEFAULT now(),
  CONSTRAINT business_hours_day_check CHECK (day_of_week BETWEEN 0 AND 6)
);

-- ── contact_information ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_information (
  id              uuid               NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_type    character varying  NOT NULL,  -- phone | email | address | whatsapp
  label           character varying  NOT NULL,
  value           text               NOT NULL,
  is_primary      boolean                       DEFAULT false,
  is_active       boolean                       DEFAULT true,
  display_order   integer                        DEFAULT 0,
  icon_name       character varying,
  additional_info jsonb,
  created_at      timestamptz                    DEFAULT now(),
  updated_at      timestamptz                    DEFAULT now()
);

-- ── social_media_accounts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id             uuid               NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform       character varying  NOT NULL,   -- instagram | facebook | youtube | twitter
  platform_name  character varying  NOT NULL,
  url            text               NOT NULL,
  username       character varying,
  icon_name      character varying,
  is_active      boolean                        DEFAULT true,
  display_order  integer                        DEFAULT 0,
  follower_count integer                        DEFAULT 0,
  description    text,
  created_at     timestamptz                    DEFAULT now(),
  updated_at     timestamptz                    DEFAULT now()
);

-- ── footer_links ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.footer_links (
  id            uuid               NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_name  character varying  NOT NULL,
  link_text     character varying  NOT NULL,
  link_url      character varying  NOT NULL,
  display_order integer                     DEFAULT 0,
  is_active     boolean                     DEFAULT true,
  opens_new_tab boolean                     DEFAULT false,
  created_at    timestamptz                 DEFAULT now(),
  updated_at    timestamptz                 DEFAULT now()
);

-- ── contact_submissions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id          uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text          DEFAULT 'new',    -- new | read | replied | archived
  user_id     uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes text,
  replied_at  timestamptz,
  replied_by  uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz   DEFAULT now(),
  updated_at  timestamptz   DEFAULT now(),
  CONSTRAINT contact_submissions_status_check
    CHECK (status IN ('new','read','replied','archived'))
);

-- ── uploaded_files ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id          uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename    text NOT NULL,
  folder      text NOT NULL DEFAULT 'uploads',
  mime_type   text NOT NULL,
  file_size   integer NOT NULL,
  file_data   text NOT NULL,   -- base64 or storage path
  url_path    text NOT NULL,
  uploaded_by uuid          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz   DEFAULT now(),
  updated_at  timestamptz   DEFAULT now()
);
