-- Create the missing RLS policy to allow instructors to update profiles in their school
CREATE POLICY "Instructors can manage profiles in their school" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Allow viewing/updating profiles in the same school
  (school_id = get_current_user_school_id()) AND 
  (
    -- Admins can update any profile
    get_current_user_role() = 'admin' OR
    -- Instructors and command staff can update profiles in their school
    get_current_user_role() = ANY (ARRAY['instructor', 'command_staff']) OR
    -- Users can update their own profile
    id = auth.uid()
  )
)
WITH CHECK (
  -- Less restrictive check - let the trigger function handle role validation
  school_id = get_current_user_school_id()
);