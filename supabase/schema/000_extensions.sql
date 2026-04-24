-- =============================================================================
-- 000_extensions.sql
-- PostgreSQL extensions required by this schema.
-- Safe to re-run on any platform (CREATE EXTENSION IF NOT EXISTS).
-- Run this FIRST before any other script.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- fast ILIKE / trigram search
CREATE EXTENSION IF NOT EXISTS "unaccent";    -- accent-insensitive search
