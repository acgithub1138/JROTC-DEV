-- Create table for event registrations
CREATE TABLE public.cp_event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.cp_competitions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.cp_comp_events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  
  -- Ensure a school can only register once per event
  UNIQUE(competition_id, event_id, school_id)
);

-- Enable RLS
ALTER TABLE public.cp_event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Schools can register for events" 
ON public.cp_event_registrations 
FOR INSERT 
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Schools can view their event registrations" 
ON public.cp_event_registrations 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Schools can update their event registrations" 
ON public.cp_event_registrations 
FOR UPDATE 
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Schools can delete their event registrations" 
ON public.cp_event_registrations 
FOR DELETE 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Hosting schools can view all registrations for their competitions" 
ON public.cp_event_registrations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.cp_competitions 
  WHERE id = cp_event_registrations.competition_id 
  AND school_id = get_current_user_school_id()
));

CREATE POLICY "Admins can manage all event registrations" 
ON public.cp_event_registrations 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Add trigger for updated_at
CREATE TRIGGER update_cp_event_registrations_updated_at
  BEFORE UPDATE ON public.cp_event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();