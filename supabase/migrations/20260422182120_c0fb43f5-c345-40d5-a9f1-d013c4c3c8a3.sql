
-- allowed_phones: admin-managed allowlist
CREATE TABLE public.allowed_phones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.allowed_phones ENABLE ROW LEVEL SECURITY;
-- No policies = no client access. Only service role / DB admin can read/write.

-- Helper function: is the current user's phone allowlisted?
CREATE OR REPLACE FUNCTION public.is_phone_allowed()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_phones ap
    JOIN auth.users u ON u.id = auth.uid()
    WHERE ap.phone = u.phone
  );
$$;

-- foods
CREATE TABLE public.foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own foods select" ON public.foods FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_phone_allowed());
CREATE POLICY "own foods insert" ON public.foods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_phone_allowed());
CREATE POLICY "own foods update" ON public.foods FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own foods delete" ON public.foods FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- meals
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  before_rating INTEGER CHECK (before_rating BETWEEN 1 AND 10),
  before_comment TEXT,
  after_rating INTEGER CHECK (after_rating BETWEEN 1 AND 10),
  after_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meals select" ON public.meals FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_phone_allowed());
CREATE POLICY "own meals insert" ON public.meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_phone_allowed());
CREATE POLICY "own meals update" ON public.meals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own meals delete" ON public.meals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX meals_user_eaten_idx ON public.meals(user_id, eaten_at DESC);

-- meal_foods
CREATE TABLE public.meal_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal_foods select" ON public.meal_foods FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_phone_allowed());
CREATE POLICY "own meal_foods insert" ON public.meal_foods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_phone_allowed());
CREATE POLICY "own meal_foods delete" ON public.meal_foods FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX meal_foods_meal_idx ON public.meal_foods(meal_id);
CREATE INDEX meal_foods_food_idx ON public.meal_foods(food_id);

-- checkins
CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  felt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checkins select" ON public.checkins FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_phone_allowed());
CREATE POLICY "own checkins insert" ON public.checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_phone_allowed());
CREATE POLICY "own checkins update" ON public.checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own checkins delete" ON public.checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX checkins_user_felt_idx ON public.checkins(user_id, felt_at DESC);
