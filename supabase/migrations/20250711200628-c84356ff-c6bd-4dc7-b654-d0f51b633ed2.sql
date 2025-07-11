-- Drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Admins can view all incidents" ON incidents;
DROP POLICY IF EXISTS "Non-admins can view incidents from their school" ON incidents;

-- Recreate the policy using the existing security definer function to avoid recursion
CREATE POLICY "Admins and school users can view incidents" 
ON incidents 
FOR SELECT 
USING (
  -- Admins can see all incidents regardless of school
  get_current_user_role() = 'admin' OR 
  -- Non-admins can only see incidents from their school
  (school_id = get_current_user_school_id())
);