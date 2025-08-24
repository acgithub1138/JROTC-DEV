-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  publish_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expire_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
CREATE POLICY "announcements: read access" 
ON public.announcements 
FOR SELECT 
USING (
  is_current_user_admin_role() OR 
  (can_user_access('announcements'::text, 'read'::text) AND is_user_in_school(school_id))
);

CREATE POLICY "announcements: create" 
ON public.announcements 
FOR INSERT 
WITH CHECK (
  is_current_user_admin_role() OR 
  (can_user_access('announcements'::text, 'create'::text) AND is_user_in_school(school_id) AND author_id = auth.uid())
);

CREATE POLICY "announcements: update" 
ON public.announcements 
FOR UPDATE 
USING (
  is_current_user_admin_role() OR 
  (can_user_access('announcements'::text, 'update'::text) AND is_user_in_school(school_id))
)
WITH CHECK (
  is_current_user_admin_role() OR 
  (can_user_access('announcements'::text, 'update'::text) AND is_user_in_school(school_id))
);

CREATE POLICY "announcements: delete" 
ON public.announcements 
FOR DELETE 
USING (
  is_current_user_admin_role() OR 
  (can_user_access('announcements'::text, 'delete'::text) AND is_user_in_school(school_id))
);

-- Create function to update timestamps
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();