-- Drop the restrictive SELECT policy that limits users to their own school
DROP POLICY "Users can view events from their school" ON cp_events;

-- Create new SELECT policy allowing all authenticated users to view all active events
CREATE POLICY "All users can view all active events" 
ON cp_events 
FOR SELECT 
USING (active = true);