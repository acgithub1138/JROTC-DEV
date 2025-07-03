-- Create a table for custom event types
CREATE TABLE public.event_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(value, school_id)
);

-- Enable Row Level Security
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view event types from their school" 
ON public.event_types 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Instructors can manage event types in their school" 
ON public.event_types 
FOR ALL 
USING (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
)
WITH CHECK (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
);

-- Insert default event types
INSERT INTO public.event_types (value, label, school_id, is_default) VALUES
('training', 'Training', (SELECT id FROM public.schools LIMIT 1), true),
('competition', 'Competition', (SELECT id FROM public.schools LIMIT 1), true),
('ceremony', 'Ceremony', (SELECT id FROM public.schools LIMIT 1), true),
('meeting', 'Meeting', (SELECT id FROM public.schools LIMIT 1), true),
('drill', 'Drill', (SELECT id FROM public.schools LIMIT 1), true),
('other', 'Other', (SELECT id FROM public.schools LIMIT 1), true);

-- Create trigger for updated_at
CREATE TRIGGER update_event_types_updated_at
BEFORE UPDATE ON public.event_types
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();