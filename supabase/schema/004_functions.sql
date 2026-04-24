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
