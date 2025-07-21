
-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS validate_profile_changes ON public.profiles;

-- Recreate the validate_profile_changes trigger
CREATE TRIGGER validate_profile_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_role_change();

-- Drop the old restrictive RLS policy
DROP POLICY IF EXISTS "Instructors can manage cadet and command staff roles in their school" ON public.profiles;

-- Create a new less restrictive RLS policy that lets the trigger handle role validation
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
