-- =============================================================================
-- patch_001_ensure_profile_exists.sql
-- Run this on the LIVE Supabase database to fix the RLS 42501 errors.
--
-- Problem:  Profile and cart INSERT requests return 42501 (RLS violation)
--           because the frontend fallback was using a direct INSERT that
--           runs as the anon role in some flows, causing auth.uid() = NULL.
--
-- Fix:      SECURITY DEFINER function that bypasses RLS for profile creation.
--           The frontend now calls this via .rpc() instead of direct INSERT.
--
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

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

GRANT EXECUTE ON FUNCTION public.ensure_profile_exists TO authenticated;

-- Verify it was created:
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'ensure_profile_exists';
