
-- Remove the unique constraint on school_id and allow null school_id for global settings
ALTER TABLE public.smtp_settings DROP CONSTRAINT IF EXISTS smtp_settings_school_id_key;

-- Add a new column to indicate if this is the global setting
ALTER TABLE public.smtp_settings ADD COLUMN is_global BOOLEAN NOT NULL DEFAULT false;

-- Allow school_id to be nullable for global settings
ALTER TABLE public.smtp_settings ALTER COLUMN school_id DROP NOT NULL;

-- Create a unique partial index to ensure only one global setting exists
CREATE UNIQUE INDEX unique_global_smtp_setting ON public.smtp_settings (is_global) WHERE is_global = true;

-- Update RLS policies to allow access to global settings
DROP POLICY IF EXISTS "Users can view their school's SMTP settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Admins can manage their school's SMTP settings" ON public.smtp_settings;

-- New policies for global SMTP settings
CREATE POLICY "Users can view global SMTP settings" 
  ON public.smtp_settings 
  FOR SELECT 
  USING (is_global = true OR school_id = get_current_user_school_id());

CREATE POLICY "Admins can manage global SMTP settings" 
  ON public.smtp_settings 
  FOR ALL 
  USING (get_current_user_role() = 'admin' AND (is_global = true OR school_id = get_current_user_school_id()));
