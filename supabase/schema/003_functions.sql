-- =============================================================================
-- 003_functions.sql
-- Helper functions used by RLS policies and triggers
-- All SECURITY DEFINER + explicit search_path to prevent privilege escalation
-- =============================================================================

-- ── Role helpers (used in RLS USING clauses) ─────────────────────────────────

-- Returns true if the current authenticated user is an admin.
-- SECURITY DEFINER so it runs as owner, avoiding RLS recursion on profiles.
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

-- Returns true if the current user is admin OR seller.
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

-- Returns the role of the current authenticated user.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── Profile auto-creation trigger ────────────────────────────────────────────
-- Called by the on_auth_user_created trigger on auth.users.
-- SECURITY DEFINER bypasses RLS so the insert always succeeds.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    preferred_language,
    newsletter_subscribed
  )
  VALUES (
    NEW.id,
    NEW.email,
    '',   -- password managed by Supabase Auth, not here
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    true,
    'en',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── updated_at auto-update trigger function ───────────────────────────────────
-- Attach this to any table that needs updated_at maintained automatically.
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

-- ── Product rating updater ────────────────────────────────────────────────────
-- Recalculates products.rating and products.review_count after review changes.
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE public.products
  SET
    rating       = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE product_id = v_product_id AND is_approved = true
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE product_id = v_product_id AND is_approved = true
    ),
    updated_at   = now()
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── Order number generator ────────────────────────────────────────────────────
-- Generates a human-readable order number like AA-20260320-0001
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
