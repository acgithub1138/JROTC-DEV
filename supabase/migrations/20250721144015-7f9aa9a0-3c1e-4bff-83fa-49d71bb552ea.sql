
-- Restore the validate_profile_changes trigger that was accidentally removed
CREATE TRIGGER validate_profile_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_role_change();

-- Update the RLS policy to be less restrictive in WITH CHECK clause
-- The trigger function will handle the proper role validation
DROP POLICY IF EXISTS "Instructors can manage cadet and command staff roles in their school" ON public.profiles;

CREATE POLICY "Instructors can manage profiles in their school" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Allow viewing/updating profiles in the same school
  (school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())) AND 
  (
    -- Admins can update any profile
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
    -- Instructors and command staff can update profiles in their school
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = ANY (ARRAY['instructor', 'command_staff']) OR
    -- Users can update their own profile
    id = auth.uid()
  )
)
WITH CHECK (
  -- Less restrictive check - let the trigger function handle role validation
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
);
