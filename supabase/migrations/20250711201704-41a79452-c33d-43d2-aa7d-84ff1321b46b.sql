-- Drop ALL existing policies on incidents table
DROP POLICY IF EXISTS "Admins and school users can view incidents" ON incidents;
DROP POLICY IF EXISTS "Admins can view all incidents" ON incidents;
DROP POLICY IF EXISTS "Non-admins can view incidents from their school" ON incidents;
DROP POLICY IF EXISTS "Only instructors can create incidents for their school" ON incidents;
DROP POLICY IF EXISTS "Users can update their own incidents" ON incidents;
DROP POLICY IF EXISTS "Admins can update any incident" ON incidents;
DROP POLICY IF EXISTS "Admins can delete incidents" ON incidents;

-- Recreate the view policy using the existing security definer function to avoid recursion
CREATE POLICY "Admins and school users can view incidents" 
ON incidents 
FOR SELECT 
USING (
  -- Admins can see all incidents regardless of school
  get_current_user_role() = 'admin' OR 
  -- Non-admins can only see incidents from their school
  (school_id = get_current_user_school_id())
);

-- Recreate other necessary policies
CREATE POLICY "Only instructors can create incidents for their school" 
ON incidents 
FOR INSERT 
WITH CHECK (
  (school_id = get_current_user_school_id()) AND 
  (submitted_by = auth.uid()) AND 
  (get_current_user_role() = ANY (ARRAY['instructor'::text, 'admin'::text]))
);

CREATE POLICY "Users can update their own incidents" 
ON incidents 
FOR UPDATE 
USING (
  (school_id = get_current_user_school_id()) AND 
  ((submitted_by = auth.uid()) OR (get_current_user_role() = 'instructor'::text))
);

CREATE POLICY "Admins can update any incident" 
ON incidents 
FOR UPDATE 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete incidents" 
ON incidents 
FOR DELETE 
USING (
  (school_id = get_current_user_school_id()) AND 
  (get_current_user_role() = 'admin')
);