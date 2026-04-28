CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.is_email_allowed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_emails ae
    JOIN auth.users u ON u.id = auth.uid()
    WHERE ae.email = u.email::extensions.citext
  );
$$;