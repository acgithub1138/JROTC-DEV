-- Create incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  severity TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'other',
  submitted_by UUID,
  assigned_to UUID,
  school_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create incident_comments table
CREATE TABLE public.incident_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  is_system_comment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incident number sequence
CREATE SEQUENCE IF NOT EXISTS incident_number_seq;

-- Create function to generate incident numbers
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('incident_number_seq') INTO next_num;
    RETURN 'INC' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Create trigger to auto-assign incident numbers
CREATE OR REPLACE FUNCTION public.assign_incident_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.incident_number IS NULL THEN
        NEW.incident_number := generate_incident_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER assign_incident_number_trigger
    BEFORE INSERT ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION assign_incident_number();

-- Create updated_at trigger for incidents
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on incidents table
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incidents
-- Users can create incidents for their school
CREATE POLICY "Users can create incidents for their school"
ON public.incidents
FOR INSERT
WITH CHECK (school_id = get_current_user_school_id() AND submitted_by = auth.uid());

-- Users can view incidents from their school
CREATE POLICY "Users can view incidents from their school"
ON public.incidents
FOR SELECT
USING (school_id = get_current_user_school_id());

-- Admins can update all incident fields
CREATE POLICY "Admins can update incidents"
ON public.incidents
FOR UPDATE
USING (
  school_id = get_current_user_school_id() AND 
  get_current_user_role() = 'admin'
);

-- Users can update incidents they submitted (limited fields)
CREATE POLICY "Users can update their own incidents"
ON public.incidents
FOR UPDATE
USING (
  school_id = get_current_user_school_id() AND 
  submitted_by = auth.uid()
);

-- Admins can delete incidents
CREATE POLICY "Admins can delete incidents"
ON public.incidents
FOR DELETE
USING (
  school_id = get_current_user_school_id() AND 
  get_current_user_role() = 'admin'
);

-- Enable RLS on incident_comments table
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_comments
-- Users can create comments on incidents from their school
CREATE POLICY "Users can create incident comments"
ON public.incident_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.incidents i 
    WHERE i.id = incident_comments.incident_id 
    AND i.school_id = get_current_user_school_id()
  )
);

-- Users can view comments on incidents from their school
CREATE POLICY "Users can view incident comments"
ON public.incident_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.incidents i 
    WHERE i.id = incident_comments.incident_id 
    AND i.school_id = get_current_user_school_id()
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own incident comments"
ON public.incident_comments
FOR UPDATE
USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.incidents i 
    WHERE i.id = incident_comments.incident_id 
    AND i.school_id = get_current_user_school_id()
  )
);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own incident comments"
ON public.incident_comments
FOR DELETE
USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.incidents i 
    WHERE i.id = incident_comments.incident_id 
    AND i.school_id = get_current_user_school_id()
  )
);

-- Add foreign key constraints
ALTER TABLE public.incident_comments
ADD CONSTRAINT incident_comments_incident_id_fkey
FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_incidents_school_id ON public.incidents(school_id);
CREATE INDEX idx_incidents_submitted_by ON public.incidents(submitted_by);
CREATE INDEX idx_incidents_assigned_to ON public.incidents(assigned_to);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incident_comments_incident_id ON public.incident_comments(incident_id);
CREATE INDEX idx_incident_comments_user_id ON public.incident_comments(user_id);