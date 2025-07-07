-- Update RLS policy to allow admins to view all incident comments
DROP POLICY IF EXISTS "Users can view incident comments" ON public.incident_comments;

CREATE POLICY "Users can view incident comments" 
ON public.incident_comments 
FOR SELECT 
USING (
  -- Admins can view all incident comments
  (get_current_user_role() = 'admin') OR
  -- Regular users can only view comments from incidents in their school
  (EXISTS ( 
    SELECT 1
    FROM incidents i
    WHERE i.id = incident_comments.incident_id 
    AND i.school_id = get_current_user_school_id()
  ))
);