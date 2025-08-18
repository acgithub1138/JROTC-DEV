-- Add logo field to schools table
ALTER TABLE public.schools 
ADD COLUMN logo_url TEXT;

-- Create storage bucket for school logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school-logos', 'school-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for school logos bucket
CREATE POLICY "School logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'school-logos');

CREATE POLICY "Users can upload school logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'school-logos' 
  AND (storage.foldername(name))[1] = get_user_school_id()::text
  AND (is_current_user_admin_role() OR can_user_access('school_settings', 'update'))
);

CREATE POLICY "Users can update school logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'school-logos' 
  AND (storage.foldername(name))[1] = get_user_school_id()::text
  AND (is_current_user_admin_role() OR can_user_access('school_settings', 'update'))
);

CREATE POLICY "Users can delete school logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'school-logos' 
  AND (storage.foldername(name))[1] = get_user_school_id()::text
  AND (is_current_user_admin_role() OR can_user_access('school_settings', 'update'))
);