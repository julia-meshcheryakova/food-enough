-- Create table for caching menu parsing results
CREATE TABLE IF NOT EXISTS public.menu_parse_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_checksum TEXT NOT NULL,
  model_name TEXT NOT NULL,
  parsed_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_cache_key UNIQUE (image_checksum, model_name)
);

-- Enable RLS
ALTER TABLE public.menu_parse_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read from cache (public menus)
CREATE POLICY "Anyone can read menu cache"
  ON public.menu_parse_cache
  FOR SELECT
  USING (true);

-- Allow anyone to insert into cache (public menus)
CREATE POLICY "Anyone can insert menu cache"
  ON public.menu_parse_cache
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_menu_cache_lookup ON public.menu_parse_cache(image_checksum, model_name);