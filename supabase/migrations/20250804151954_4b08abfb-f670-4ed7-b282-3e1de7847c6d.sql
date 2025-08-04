-- Create table for competition event schedules
CREATE TABLE public.cp_event_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL,
  event_id UUID NOT NULL,
  school_id UUID NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT fk_cp_event_schedules_competition 
    FOREIGN KEY (competition_id) REFERENCES cp_competitions(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_event_schedules_event 
    FOREIGN KEY (event_id) REFERENCES cp_comp_events(id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_event_schedules_school 
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  -- Prevent double booking: same school can't have multiple slots for same event
  CONSTRAINT unique_school_event UNIQUE (event_id, school_id)
);

-- Enable RLS
ALTER TABLE public.cp_event_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for schedule access
CREATE POLICY "Admins can manage all event schedules" 
ON public.cp_event_schedules 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Hosting schools can manage schedules for their competitions" 
ON public.cp_event_schedules 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM cp_competitions 
    WHERE cp_competitions.id = cp_event_schedules.competition_id 
    AND cp_competitions.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "All users can view event schedules" 
ON public.cp_event_schedules 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger
CREATE TRIGGER update_cp_event_schedules_updated_at
BEFORE UPDATE ON public.cp_event_schedules
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for performance
CREATE INDEX idx_cp_event_schedules_competition_event 
ON public.cp_event_schedules(competition_id, event_id);

CREATE INDEX idx_cp_event_schedules_time 
ON public.cp_event_schedules(scheduled_time);