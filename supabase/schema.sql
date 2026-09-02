-- Food Enough — full schema, idempotent. Safe to paste into the Supabase
-- SQL editor and re-run.
--
-- Status on project borxkhboskbdngtrdpsd (2026-09-02):
--   menu_parse_cache, dish_images  -> already exist
--   profiles, usage                -> MISSING, created by this file

-- ---------------------------------------------------------------- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restrictions TEXT[] DEFAULT '{}',
  hated_ingredients TEXT[] DEFAULT '{}',
  favorite_ingredients TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  excluded_categories TEXT[] DEFAULT '{}',
  profile_name TEXT DEFAULT 'Custom',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill rows for users who signed up while the table was missing.
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------- usage
CREATE TABLE IF NOT EXISTS public.usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'menu_analysis',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_month
  ON public.usage (user_id, created_at);

ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own usage" ON public.usage;
CREATE POLICY "Users read own usage" ON public.usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own usage" ON public.usage;
CREATE POLICY "Users insert own usage" ON public.usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------- menu_parse_cache
CREATE TABLE IF NOT EXISTS public.menu_parse_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_checksum TEXT NOT NULL,
  model_name TEXT NOT NULL,
  parsed_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_cache_key UNIQUE (image_checksum, model_name)
);

CREATE INDEX IF NOT EXISTS idx_menu_cache_lookup
  ON public.menu_parse_cache(image_checksum, model_name);

ALTER TABLE public.menu_parse_cache ENABLE ROW LEVEL SECURITY;

-- Parsed menus are public data; the cache is shared to avoid re-billing Gemini.
DROP POLICY IF EXISTS "Anyone can read menu cache" ON public.menu_parse_cache;
CREATE POLICY "Anyone can read menu cache" ON public.menu_parse_cache
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert menu cache" ON public.menu_parse_cache;
CREATE POLICY "Anyone can insert menu cache" ON public.menu_parse_cache
  FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------- dish_images
CREATE TABLE IF NOT EXISTS public.dish_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_name TEXT NOT NULL,
  dish_description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dish_name, dish_description)
);

CREATE INDEX IF NOT EXISTS idx_dish_images_name
  ON public.dish_images(dish_name);

ALTER TABLE public.dish_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cached dish images" ON public.dish_images;
CREATE POLICY "Anyone can view cached dish images" ON public.dish_images
  FOR SELECT USING (true);

-- Writes come from edge functions only — image generation is the costly path.
DROP POLICY IF EXISTS "Service role can manage dish images" ON public.dish_images;
CREATE POLICY "Service role can manage dish images" ON public.dish_images
  FOR ALL USING (auth.role() = 'service_role');
