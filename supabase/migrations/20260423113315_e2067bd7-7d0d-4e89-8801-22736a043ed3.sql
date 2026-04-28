-- Move citext to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION citext SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated, anon, service_role;

-- Explicit deny-all policy for allowed_emails (admin-managed, no client access)
CREATE POLICY "no client access to allowed_emails"
  ON public.allowed_emails
  FOR SELECT TO authenticated, anon
  USING (false);