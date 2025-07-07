-- Update RLS policies to restrict incident creation to instructors+ and limit editing permissions

-- Drop existing create policy and create new one for instructors only
DROP POLICY IF EXISTS "Users can create incidents for their school" ON public.incidents;

CREATE POLICY "Only instructors can create incidents for their school"
ON public.incidents
FOR INSERT
WITH CHECK (
  (school_id = get_current_user_school_id()) AND 
  (submitted_by = auth.uid()) AND
  (get_current_user_role() = ANY (ARRAY['instructor', 'command_staff', 'admin']))
);