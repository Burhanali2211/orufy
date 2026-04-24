-- =============================================================================
-- Migration 002: Profile auto-creation trigger + missing RLS policies
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- =============================================================================

-- ── 1. Trigger function: auto-create a profile row when a new auth user signs up ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER           -- runs as superuser, bypasses RLS
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
    '',
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

-- ── 2. Attach trigger to auth.users ──
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 3. Allow authenticated users to INSERT their own profile row ──
--    (needed as a fallback for users who signed up before the trigger was added)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ── 4. Backfill: create profile rows for any existing auth users that are missing one ──
--    This fixes users who signed up before the trigger was created.
INSERT INTO public.profiles (id, email, password_hash, full_name, role, is_active, preferred_language, newsletter_subscribed)
SELECT
  u.id,
  u.email,
  '',
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  COALESCE(u.raw_user_meta_data->>'role', 'customer'),
  true,
  'en',
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
