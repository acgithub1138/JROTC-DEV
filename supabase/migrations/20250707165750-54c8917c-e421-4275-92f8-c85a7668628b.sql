-- Remove command staff access from incident RLS policies

-- Update the create policy to remove command_staff
DROP POLICY IF EXISTS "Only instructors can create incidents for their school" ON public.incidents;

CREATE POLICY "Only instructors can create incidents for their school"
ON public.incidents
FOR INSERT
WITH CHECK (
  (school_id = get_current_user_school_id()) AND 
  (submitted_by = auth.uid()) AND
  (get_current_user_role() = ANY (ARRAY['instructor', 'admin']))
);

-- Update the update policy to remove command_staff
DROP POLICY IF EXISTS "Users can update their own incidents" ON public.incidents;

CREATE POLICY "Users can update their own incidents" 
ON public.incidents 
FOR UPDATE 
USING (
  (school_id = get_current_user_school_id()) AND 
  (
    (submitted_by = auth.uid()) OR 
    (get_current_user_role() = 'instructor'::text)
  )
);