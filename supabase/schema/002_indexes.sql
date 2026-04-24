-- =============================================================================
-- 002_indexes.sql
-- All performance indexes — safe to re-run (CREATE INDEX IF NOT EXISTS)
-- =============================================================================

-- ── profiles ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_email  ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role   ON public.profiles (role);

-- ── categories ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_slug      ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active    ON public.categories (is_active);

-- ── products ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_slug        ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id   ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_homepage    ON public.products (show_on_homepage) WHERE show_on_homepage = true;
-- Full-text search index on name + description
CREATE INDEX IF NOT EXISTS idx_products_fts
  ON public.products USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')));

-- ── product_variants ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants (product_id);

-- ── addresses ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);

-- ── cart_items ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id    ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items (product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items (variant_id);

-- ── wishlist_items ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id    ON public.wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON public.wishlist_items (product_id);

-- ── orders ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id                ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                 ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status         ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at             ON public.orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id      ON public.orders (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id    ON public.orders (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_payment_status ON public.orders (user_id, payment_status);

-- ── order_items ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_items_order_id    ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id  ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id  ON public.order_items (variant_id);

-- ── order_tracking ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id   ON public.order_tracking (order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status     ON public.order_tracking (status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON public.order_tracking (created_at);

-- ── payment_logs ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id             ON public.payment_logs (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_razorpay_payment_id  ON public.payment_logs (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type           ON public.payment_logs (event_type);

-- ── payment_methods ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods (user_id);

-- ── reviews ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_product_id  ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id     ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved    ON public.reviews (is_approved) WHERE is_approved = true;

-- ── notification_preferences ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences (user_id);

-- ── site_settings ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_site_settings_key      ON public.site_settings (setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON public.site_settings (category);
CREATE INDEX IF NOT EXISTS idx_site_settings_public   ON public.site_settings (is_public) WHERE is_public = true;

-- ── admin_dashboard_settings ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_dashboard_settings (setting_key);

-- ── business_hours ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON public.business_hours (day_of_week);

-- ── contact_information ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contact_info_type ON public.contact_information (contact_type, is_active);

-- ── social_media_accounts ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_media_active ON public.social_media_accounts (is_active, display_order);

-- ── footer_links ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_footer_links_section ON public.footer_links (section_name, display_order);

-- ── contact_submissions ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status     ON public.contact_submissions (status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email      ON public.contact_submissions (email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id    ON public.contact_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions (created_at);

-- ── uploaded_files ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_uploaded_files_folder      ON public.uploaded_files (folder);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON public.uploaded_files (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_url_path    ON public.uploaded_files (url_path);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at  ON public.uploaded_files (created_at DESC);
