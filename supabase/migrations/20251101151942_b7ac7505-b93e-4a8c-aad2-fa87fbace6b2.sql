-- Create table to cache generated dish images
CREATE TABLE IF NOT EXISTS public.dish_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_name TEXT NOT NULL,
  dish_description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(dish_name, dish_description)
);

-- Create index for faster lookups
CREATE INDEX idx_dish_images_name ON public.dish_images(dish_name);

-- Enable RLS (required but we'll keep it simple for now)
ALTER TABLE public.dish_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cached images
CREATE POLICY "Anyone can view cached dish images"
  ON public.dish_images
  FOR SELECT
  USING (true);

-- Only service role can insert/update (done from edge functions)
CREATE POLICY "Service role can manage dish images"
  ON public.dish_images
  FOR ALL
  USING (auth.role() = 'service_role');