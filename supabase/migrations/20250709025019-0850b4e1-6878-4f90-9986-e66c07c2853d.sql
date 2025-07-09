-- Modify competition_events table to support multiple cadets per score sheet
ALTER TABLE public.competition_events 
  DROP COLUMN cadet_id,
  ADD COLUMN cadet_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN team_name TEXT;

-- Update RLS policies to work with the new structure
DROP POLICY IF EXISTS "Instructors can manage competition events in their school" ON public.competition_events;
DROP POLICY IF EXISTS "Users can view competition events from their school" ON public.competition_events;

-- Recreate policies for the updated table structure
CREATE POLICY "Instructors can manage competition events in their school" 
ON public.competition_events 
FOR ALL 
USING (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
)
WITH CHECK (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
);

CREATE POLICY "Users can view competition events from their school" 
ON public.competition_events 
FOR SELECT 
USING (school_id = get_current_user_school_id());