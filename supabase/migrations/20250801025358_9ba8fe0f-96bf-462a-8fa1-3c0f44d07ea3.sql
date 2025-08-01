-- Add a policy to allow users to view events from their school
CREATE POLICY "Users can view events from their school" 
ON cp_events 
FOR SELECT 
USING (school_id = get_current_user_school_id());