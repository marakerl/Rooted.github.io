-- citext for case-insensitive emails
CREATE EXTENSION IF NOT EXISTS citext;

-- New allowlist table
CREATE TABLE public.allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- New helper function
CREATE OR REPLACE FUNCTION public.is_email_allowed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_emails ae
    JOIN auth.users u ON u.id = auth.uid()
    WHERE ae.email = u.email::citext
  );
$$;

-- Drop old policies that reference is_phone_allowed()
DROP POLICY IF EXISTS "own checkins insert" ON public.checkins;
DROP POLICY IF EXISTS "own checkins select" ON public.checkins;
DROP POLICY IF EXISTS "own foods insert" ON public.foods;
DROP POLICY IF EXISTS "own foods select" ON public.foods;
DROP POLICY IF EXISTS "own meal_foods insert" ON public.meal_foods;
DROP POLICY IF EXISTS "own meal_foods select" ON public.meal_foods;
DROP POLICY IF EXISTS "own meals insert" ON public.meals;
DROP POLICY IF EXISTS "own meals select" ON public.meals;

-- Recreate them using is_email_allowed()
CREATE POLICY "own checkins insert" ON public.checkins
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND public.is_email_allowed());
CREATE POLICY "own checkins select" ON public.checkins
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) AND public.is_email_allowed());

CREATE POLICY "own foods insert" ON public.foods
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND public.is_email_allowed());
CREATE POLICY "own foods select" ON public.foods
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) AND public.is_email_allowed());

CREATE POLICY "own meal_foods insert" ON public.meal_foods
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND public.is_email_allowed());
CREATE POLICY "own meal_foods select" ON public.meal_foods
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) AND public.is_email_allowed());

CREATE POLICY "own meals insert" ON public.meals
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND public.is_email_allowed());
CREATE POLICY "own meals select" ON public.meals
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) AND public.is_email_allowed());

-- Drop old phone-based helpers
DROP FUNCTION IF EXISTS public.is_phone_allowed();
DROP TABLE IF EXISTS public.allowed_phones;