-- Drop the existing policy first
DROP POLICY IF EXISTS "School-based incident visibility with admin override" ON incidents;

-- Create a more robust admin policy for incidents
CREATE POLICY "Admins can view all incidents" 
ON incidents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a school-based policy for non-admins
CREATE POLICY "Non-admins can view incidents from their school" 
ON incidents 
FOR SELECT 
USING (
  school_id = (
    SELECT school_id FROM profiles 
    WHERE profiles.id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);