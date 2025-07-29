-- Update profile_history RLS policy to allow admins to see all profile history
DROP POLICY IF EXISTS "Users can view profile history from their school" ON public.profile_history;

CREATE POLICY "Users can view profile history from their school or admins can view all"
ON public.profile_history
FOR SELECT
USING (
  school_id = get_current_user_school_id() 
  OR get_current_user_role() = 'admin'
);