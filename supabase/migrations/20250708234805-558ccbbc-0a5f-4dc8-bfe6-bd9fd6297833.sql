-- Add a policy to allow viewing basic profile info for incident assignments
-- This allows users to see minimal profile data (name, email) for people assigned to incidents
-- even if they're from different schools, for incident management purposes

CREATE POLICY "Users can view basic profile info for incident assignments"
ON public.profiles
FOR SELECT
USING (
  -- Allow viewing profile if the profile is referenced in an incident that the user can see
  EXISTS (
    SELECT 1 FROM public.incidents i 
    WHERE (i.assigned_to = profiles.id OR i.submitted_by = profiles.id)
    AND (i.school_id = get_current_user_school_id() OR get_current_user_role() = 'admin')
  )
);