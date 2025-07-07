-- Update RLS policy to allow admins to update any incident
DROP POLICY IF EXISTS "Admins can update incidents" ON public.incidents;

CREATE POLICY "Admins can update any incident" 
ON public.incidents 
FOR UPDATE 
USING (get_current_user_role() = 'admin');

-- Keep the user policy unchanged
-- Users can still only update their own incidents within their school