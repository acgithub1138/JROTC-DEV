
-- Create SMTP settings table
CREATE TABLE public.smtp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_username TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT 'School System',
  use_tls BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

-- Enable RLS
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for smtp_settings
CREATE POLICY "Users can view their school's SMTP settings" 
  ON public.smtp_settings 
  FOR SELECT 
  USING (school_id = get_current_user_school_id());

CREATE POLICY "Admins can manage their school's SMTP settings" 
  ON public.smtp_settings 
  FOR ALL 
  USING (school_id = get_current_user_school_id() AND get_current_user_role() = 'admin');

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
