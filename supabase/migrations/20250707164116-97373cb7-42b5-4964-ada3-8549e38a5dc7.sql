-- Fix RLS policy for incident comments to allow system comments
DROP POLICY IF EXISTS "Users can create incident comments" ON public.incident_comments;

CREATE POLICY "Users can create incident comments" 
ON public.incident_comments 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) AND 
  (EXISTS (
    SELECT 1 FROM incidents i 
    WHERE i.id = incident_comments.incident_id 
    AND i.school_id = get_current_user_school_id()
  ))
);