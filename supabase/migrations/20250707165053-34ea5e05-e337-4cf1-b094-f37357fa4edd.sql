-- Update RLS policy to allow instructors to update any incident from their school
DROP POLICY IF EXISTS "Users can update their own incidents" ON public.incidents;

CREATE POLICY "Users can update their own incidents" 
ON public.incidents 
FOR UPDATE 
USING (
  (school_id = get_current_user_school_id()) AND 
  (
    (submitted_by = auth.uid()) OR 
    (get_current_user_role() = ANY (ARRAY['instructor', 'command_staff']))
  )
);