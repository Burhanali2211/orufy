-- =============================================================================
-- run_supabase.sql
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │  FOR SUPABASE — set up a fresh project database.                        │
-- │  001_auth_compat.sql is intentionally SKIPPED — Supabase already        │
-- │  provides auth.users, auth.uid(), auth.role(), and the required roles.  │
-- └─────────────────────────────────────────────────────────────────────────┘
--
-- ── Option A: psql (recommended — runs all files automatically) ────────────
--
--   psql "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" \
--     --file=run_supabase.sql
--
--   The \i commands below only work inside psql.
--   Run this file from the supabase/schema/ directory so the relative paths work:
--     cd supabase/schema
--     psql "..." --file=run_supabase.sql
--
-- ── Option B: Supabase SQL Editor (paste each file individually) ───────────
--
--   The SQL Editor does not support \i metacommands.
--   Paste and run each file in this order:
--     1. 000_extensions.sql
--     2. 002_tables.sql
--     3. 003_indexes.sql
--     4. 004_functions.sql
--     5. 005_triggers.sql
--     6. 006_rls_policies.sql
--     7. 007_seed_data.sql
--   (Skip 001_auth_compat.sql — Supabase provides that layer natively.)
--
-- =============================================================================

\i 000_extensions.sql
-- 001_auth_compat.sql  ← SKIPPED: Supabase provides this natively
\i 002_tables.sql
\i 003_indexes.sql
\i 004_functions.sql
\i 005_triggers.sql
\i 006_rls_policies.sql
\i 007_seed_data.sql
