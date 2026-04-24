-- =============================================================================
-- run_postgres.sql
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  FOR PLAIN POSTGRESQL — set up a fresh database on any standard         │
-- │  PostgreSQL 14+ server (no Supabase required).                          │
-- │  001_auth_compat.sql IS included — it creates the auth schema,          │
-- │  auth.users, auth.uid() / auth.role() / auth.email() functions, and     │
-- │  the anon / authenticated / service_role roles the rest of the schema   │
-- │  depends on.                                                            │
-- └─────────────────────────────────────────────────────────────────────────┘
--
-- Prerequisites:
--   • PostgreSQL 14 or higher
--   • Database already created:  CREATE DATABASE orufy;
--   • Run as a superuser (needs CREATEDB + CREATEROLE privileges)
--
-- ── How to run ─────────────────────────────────────────────────────────────
--
--   Run from the supabase/schema/ directory (so \i relative paths work):
--
--     cd supabase/schema
--     psql -U postgres -d orufy --file=run_postgres.sql
--
--   The \i commands below are psql metacommands — they do not work if you
--   paste this file into a GUI tool like pgAdmin or DBeaver. In that case,
--   open and run each file individually in this order:
--     1. 000_extensions.sql
--     2. 001_auth_compat.sql
--     3. 002_tables.sql
--     4. 003_indexes.sql
--     5. 004_functions.sql
--     6. 005_triggers.sql
--     7. 006_rls_policies.sql
--     8. 007_seed_data.sql
--
-- ── Simulating an authenticated session in psql after setup ────────────────
--
--   SET LOCAL request.jwt.claims = '{"sub":"<user-uuid>","role":"authenticated"}';
--
-- =============================================================================

\i 000_extensions.sql
\i 001_auth_compat.sql
\i 002_tables.sql
\i 003_indexes.sql
\i 004_functions.sql
\i 005_triggers.sql
\i 006_rls_policies.sql
\i 007_seed_data.sql
