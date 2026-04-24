-- =============================================================================
-- 001_auth_compat.sql
-- PostgreSQL compatibility layer — creates the auth schema, auth.users table,
-- and auth.uid() / auth.role() functions that Supabase provides natively.
--
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  SUPABASE USERS: SKIP THIS FILE.                                        │
-- │  Supabase already provides everything here. Running it is harmless      │
-- │  (all statements are guarded with IF NOT EXISTS / OR REPLACE), but      │
-- │  the run_supabase.sql runner skips it automatically.                    │
-- │                                                                         │
-- │  PLAIN POSTGRESQL USERS: run_postgres.sql includes this file.           │
-- │  It creates a minimal Supabase-compatible auth layer so the rest of     │
-- │  the schema (RLS policies, triggers) works identically on both.         │
-- └─────────────────────────────────────────────────────────────────────────┘
--
-- How auth.uid() works in both environments:
--   Supabase / PostgREST sets request.jwt.claims as a session variable.
--   auth.uid() reads the "sub" (subject = user UUID) from that claim.
--   In plain Postgres (without PostgREST) you set it manually per session:
--     SET LOCAL request.jwt.claims = '{"sub":"<user-uuid>","role":"authenticated"}';
-- =============================================================================

-- ── Create auth schema if it doesn't exist ────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS auth;

-- ── auth.users — mirrors Supabase's auth.users table ─────────────────────────
-- Stores credentials and metadata for all users.
-- In a Supabase project this table is managed internally; here we own it.
CREATE TABLE IF NOT EXISTS auth.users (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email                text        NOT NULL UNIQUE,
  encrypted_password   text,                          -- bcrypt hash via pgcrypto crypt()
  email_confirmed_at   timestamptz,                   -- NULL = not yet verified
  raw_user_meta_data   jsonb                DEFAULT '{}',
  raw_app_meta_data    jsonb                DEFAULT '{"provider":"email","providers":["email"]}',
  role                 text                 DEFAULT 'authenticated',
  last_sign_in_at      timestamptz,
  created_at           timestamptz          DEFAULT now(),
  updated_at           timestamptz          DEFAULT now(),
  banned_until         timestamptz,
  CONSTRAINT auth_users_email_check CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS auth_users_email_idx ON auth.users (email);

-- ── auth.uid() ────────────────────────────────────────────────────────────────
-- Returns the UUID of the currently authenticated user.
-- PostgREST (and Supabase) set request.jwt.claims before each request.
-- For direct psql sessions, SET LOCAL request.jwt.claims = '{"sub":"<uuid>"}';
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      current_setting('app.current_user_id', true)         -- fallback for testing
    ),
    ''
  )::uuid;
$$;

-- ── auth.role() ───────────────────────────────────────────────────────────────
-- Returns the role from the JWT claim (e.g. "authenticated", "anon", "service_role").
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('request.role', true),
    'anon'
  );
$$;

-- ── auth.email() ──────────────────────────────────────────────────────────────
-- Returns the email from JWT claims (Supabase compatibility).
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'email';
$$;

-- ── Helper: register a new user (plain Postgres only) ─────────────────────────
-- Creates an entry in auth.users. On Supabase, signup goes through the Auth API.
-- Usage: SELECT auth.create_user('user@example.com', 'plaintext_password', '{"full_name":"John"}');
CREATE OR REPLACE FUNCTION auth.create_user(
  p_email    text,
  p_password text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data, email_confirmed_at)
  VALUES (
    v_id,
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf', 12)),
    p_metadata,
    now()                        -- auto-confirm for plain Postgres
  );
  RETURN v_id;
END;
$$;

-- ── Helper: verify login (plain Postgres only) ────────────────────────────────
-- Returns the user UUID if email + password match, NULL otherwise.
-- Usage: SELECT auth.verify_password('user@example.com', 'password');
CREATE OR REPLACE FUNCTION auth.verify_password(p_email text, p_password text)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER
SET search_path = auth
AS $$
  SELECT id FROM auth.users
  WHERE email = lower(trim(p_email))
    AND encrypted_password = crypt(p_password, encrypted_password)
    AND (banned_until IS NULL OR banned_until < now());
$$;

-- ── Grants ────────────────────────────────────────────────────────────────────
-- Allow the application role (anon / authenticated) to call auth functions.
-- Adjust role names to match your PostgreSQL setup.
DO $$
BEGIN
  -- Create roles if they don't exist (Supabase creates these automatically)
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA auth   TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION auth.uid()    TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role()   TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.email()  TO anon, authenticated, service_role;

-- Allow app roles to read/write public schema tables (RLS will restrict further)
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
