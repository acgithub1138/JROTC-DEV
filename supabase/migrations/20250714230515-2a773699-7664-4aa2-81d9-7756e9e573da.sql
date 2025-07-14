-- Drop the problematic policy
DROP POLICY IF EXISTS "Instructors can update cadets in their school" ON public.profiles;

-- Create a corrected policy without the problematic subquery
CREATE POLICY "Instructors can update cadets in their school" 
ON public.profiles 
FOR UPDATE 
USING (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor', 'command_staff', 'admin'])
  AND role = 'cadet'
) 
WITH CHECK (
  school_id = get_current_user_school_id() 
  AND role = 'cadet'
);