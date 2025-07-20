
-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  jrotc_program jrotc_program NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#1f2937',
  secondary_color TEXT NOT NULL DEFAULT '#6b7280',
  theme_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(school_id, jrotc_program)
);

-- Create storage bucket for theme images
INSERT INTO storage.buckets (id, name, public)
VALUES ('theme-images', 'theme-images', true);

-- Enable RLS on themes table
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for themes table
CREATE POLICY "Only admins can manage themes"
  ON public.themes
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can view themes from their school"
  ON public.themes
  FOR SELECT
  USING (school_id = get_current_user_school_id());

-- Create storage policies for theme images bucket
CREATE POLICY "Admins can upload theme images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'theme-images' AND
    (SELECT get_current_user_role()) = 'admin'
  );

CREATE POLICY "Everyone can view theme images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'theme-images');

CREATE POLICY "Admins can update theme images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'theme-images' AND
    (SELECT get_current_user_role()) = 'admin'
  );

CREATE POLICY "Admins can delete theme images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'theme-images' AND
    (SELECT get_current_user_role()) = 'admin'
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_themes_updated_at_trigger
  BEFORE UPDATE ON public.themes
  FOR EACH ROW
  EXECUTE FUNCTION update_themes_updated_at();
