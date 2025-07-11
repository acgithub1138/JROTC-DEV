-- Create incident status options table
CREATE TABLE public.incident_status_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  color_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incident priority options table
CREATE TABLE public.incident_priority_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  color_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default incident status options
INSERT INTO public.incident_status_options (value, label, color_class, sort_order) VALUES
('open', 'Open', 'bg-blue-100 text-blue-800', 1),
('in_progress', 'In Progress', 'bg-yellow-100 text-yellow-800', 2),
('resolved', 'Resolved', 'bg-green-100 text-green-800', 3),
('closed', 'Closed', 'bg-gray-100 text-gray-800', 4);

-- Insert default incident priority options
INSERT INTO public.incident_priority_options (value, label, color_class, sort_order) VALUES
('low', 'Low', 'bg-green-100 text-green-800', 1),
('medium', 'Medium', 'bg-yellow-100 text-yellow-800', 2),
('high', 'High', 'bg-orange-100 text-orange-800', 3),
('critical', 'Critical', 'bg-red-100 text-red-800', 4);

-- Create incident sequence for auto-numbering
CREATE SEQUENCE IF NOT EXISTS incident_number_seq START 1;

-- Create incidents table (based on tasks structure)
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  school_id UUID NOT NULL,
  created_by UUID,
  assigned_to_admin UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create incident_comments table (based on task_comments structure)
CREATE TABLE public.incident_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  is_system_comment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.incidents ADD CONSTRAINT incidents_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);
ALTER TABLE public.incidents ADD CONSTRAINT incidents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.incidents ADD CONSTRAINT incidents_assigned_to_admin_fkey FOREIGN KEY (assigned_to_admin) REFERENCES public.profiles(id);

ALTER TABLE public.incident_comments ADD CONSTRAINT incident_comments_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;
ALTER TABLE public.incident_comments ADD CONSTRAINT incident_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Create function to generate incident numbers
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('incident_number_seq') INTO next_num;
    RETURN 'INC' || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to assign incident numbers
CREATE OR REPLACE FUNCTION public.assign_incident_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.incident_number IS NULL THEN
        NEW.incident_number := generate_incident_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assigning incident numbers
CREATE TRIGGER assign_incident_number_trigger
    BEFORE INSERT ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION assign_incident_number();

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER handle_updated_at_incidents
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_incident_status_options
    BEFORE UPDATE ON public.incident_status_options
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_incident_priority_options
    BEFORE UPDATE ON public.incident_priority_options
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS on all incident tables
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_status_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_priority_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incidents table
-- Schools can view only their own incidents
CREATE POLICY "Schools can view their own incidents" 
ON public.incidents 
FOR SELECT 
USING (
  school_id = get_current_user_school_id() OR 
  get_current_user_role() = 'admin'
);

-- Schools can create incidents for their school
CREATE POLICY "Schools can create incidents for their school" 
ON public.incidents 
FOR INSERT 
WITH CHECK (school_id = get_current_user_school_id());

-- Schools can update their own incidents, admins can update any
CREATE POLICY "Schools can update their own incidents, admins can update any" 
ON public.incidents 
FOR UPDATE 
USING (
  school_id = get_current_user_school_id() OR 
  get_current_user_role() = 'admin'
);

-- Only admins can delete incidents
CREATE POLICY "Only admins can delete incidents" 
ON public.incidents 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- RLS Policies for incident_comments table
-- Users can view comments on incidents they can access
CREATE POLICY "Users can view comments on accessible incidents" 
ON public.incident_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.incidents 
    WHERE incidents.id = incident_comments.incident_id 
    AND (
      incidents.school_id = get_current_user_school_id() OR 
      get_current_user_role() = 'admin'
    )
  )
);

-- Users can create comments on incidents they can access
CREATE POLICY "Users can create comments on accessible incidents" 
ON public.incident_comments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.incidents 
    WHERE incidents.id = incident_comments.incident_id 
    AND (
      incidents.school_id = get_current_user_school_id() OR 
      get_current_user_role() = 'admin'
    )
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" 
ON public.incident_comments 
FOR UPDATE 
USING (user_id = auth.uid());

-- Users can delete their own comments, admins can delete any
CREATE POLICY "Users can delete their own comments, admins can delete any" 
ON public.incident_comments 
FOR DELETE 
USING (
  user_id = auth.uid() OR 
  get_current_user_role() = 'admin'
);

-- RLS Policies for incident options tables (everyone can view)
CREATE POLICY "Everyone can view incident status options" 
ON public.incident_status_options 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Everyone can view incident priority options" 
ON public.incident_priority_options 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage options
CREATE POLICY "Only admins can manage incident status options" 
ON public.incident_status_options 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can manage incident priority options" 
ON public.incident_priority_options 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Create validation functions
CREATE OR REPLACE FUNCTION public.validate_incident_status(status_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM incident_status_options 
    WHERE value = status_value AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.validate_incident_priority(priority_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM incident_priority_options 
    WHERE value = priority_value AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;