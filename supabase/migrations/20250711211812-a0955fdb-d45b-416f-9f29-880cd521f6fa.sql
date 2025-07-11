-- Add fallback RLS policies for incidents table using get_user_school_id()

-- Fallback policy for admins to view all incidents
CREATE POLICY "Admins can view all incidents (fallback)" 
ON incidents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Fallback policy for users to view incidents from their school
CREATE POLICY "Users can view incidents from their school (fallback)" 
ON incidents 
FOR SELECT 
USING (
  school_id = (
    SELECT school_id FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);