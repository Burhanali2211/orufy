CREATE USER platform_app WITH PASSWORD 'password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
GRANT ALL PRIVILEGES ON DATABASE platform_db TO platform_app;

\c platform_db;

ALTER SCHEMA public OWNER TO platform_app;
GRANT ALL ON SCHEMA public TO platform_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO platform_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO platform_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO platform_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO platform_app;

-- Create the membership lookup function as superuser (postgres) to safely bypass RLS
-- specifically for this one lookup, avoiding infinite recursion.
\c platform_db;

CREATE OR REPLACE FUNCTION public.is_store_member_secure(p_user_id uuid, p_store_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE user_id = p_user_id
    AND store_id = p_store_id
    AND role = ANY(p_roles)
  );
$$;

-- Ensure platform_app cannot redefine it
REVOKE ALL ON FUNCTION public.is_store_member_secure(uuid, uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_member_secure(uuid, uuid, text[]) TO platform_app;

