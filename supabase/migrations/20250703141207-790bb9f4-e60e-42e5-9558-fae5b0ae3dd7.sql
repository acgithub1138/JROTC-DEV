-- Create enum types for events
CREATE TYPE public.event_type AS ENUM ('training', 'competition', 'ceremony', 'meeting', 'drill', 'other');
CREATE TYPE public.assignee_type AS ENUM ('team', 'cadet');
CREATE TYPE public.assignment_status AS ENUM ('assigned', 'confirmed', 'declined', 'completed');

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  event_type public.event_type NOT NULL DEFAULT 'other',
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_assignments table
CREATE TABLE public.event_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  assignee_type public.assignee_type NOT NULL,
  assignee_id UUID NOT NULL,
  role TEXT,
  status public.assignment_status NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Users can view events from their school" 
ON public.events 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Instructors can manage events in their school" 
ON public.events 
FOR ALL 
USING (school_id = get_current_user_school_id() AND get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin']))
WITH CHECK (school_id = get_current_user_school_id() AND get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin']));

-- Create RLS policies for event_assignments
CREATE POLICY "Users can view event assignments from their school" 
ON public.event_assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_assignments.event_id 
  AND events.school_id = get_current_user_school_id()
));

CREATE POLICY "Instructors can manage event assignments in their school" 
ON public.event_assignments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_assignments.event_id 
  AND events.school_id = get_current_user_school_id()
  AND get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = event_assignments.event_id 
  AND events.school_id = get_current_user_school_id()
  AND get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
));

-- Create trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();