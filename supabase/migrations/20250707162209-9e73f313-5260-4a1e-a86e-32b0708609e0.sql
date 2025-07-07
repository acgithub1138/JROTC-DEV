-- Update RLS policy to allow admins to view all incidents
DROP POLICY IF EXISTS "Users can view incidents from their school" ON public.incidents;

CREATE POLICY "Users can view incidents from their school or admins can view all" 
ON public.incidents 
FOR SELECT 
USING (
  (school_id = get_current_user_school_id()) OR 
  (get_current_user_role() = 'admin')
);