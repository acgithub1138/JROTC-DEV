-- Remove the existing SELECT policy for incidents
DROP POLICY IF EXISTS "Users can view incidents from their school or admins can view a" ON public.incidents;

-- Create new policy: Non-admins see only their school's incidents, admins see all incidents
CREATE POLICY "School-based incident visibility with admin override" 
ON public.incidents 
FOR SELECT 
USING (
  (get_current_user_role() = 'admin') OR 
  (school_id = get_current_user_school_id())
);