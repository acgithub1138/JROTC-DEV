-- Update RLS policy for cp_comp_schools to allow hosting schools to see all registrations for their competitions
DROP POLICY IF EXISTS "Hosting schools can manage their comp schools" ON cp_comp_schools;
DROP POLICY IF EXISTS "Schools can view their event registrations" ON cp_comp_schools;
DROP POLICY IF EXISTS "Schools can register for events" ON cp_comp_schools;
DROP POLICY IF EXISTS "Schools can update their event registrations" ON cp_comp_schools;
DROP POLICY IF EXISTS "Schools can delete their event registrations" ON cp_comp_schools;

-- Create new comprehensive policies
CREATE POLICY "Schools can view registrations for their competitions or their own registrations" 
ON cp_comp_schools 
FOR SELECT 
USING (
  -- Users can see their own school's registrations
  school_id = get_current_user_school_id() 
  OR 
  -- Users can see all registrations for competitions their school hosts
  EXISTS (
    SELECT 1 FROM cp_competitions 
    WHERE cp_competitions.id = cp_comp_schools.competition_id 
    AND cp_competitions.school_id = get_current_user_school_id()
  )
  OR
  -- Admins can see everything
  get_current_user_role() = 'admin'
);

CREATE POLICY "Schools can register for competitions" 
ON cp_comp_schools 
FOR INSERT 
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Schools can update their own registrations" 
ON cp_comp_schools 
FOR UPDATE 
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Schools can delete their own registrations" 
ON cp_comp_schools 
FOR DELETE 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Hosting schools and admins can manage all registrations for their competitions" 
ON cp_comp_schools 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM cp_competitions 
    WHERE cp_competitions.id = cp_comp_schools.competition_id 
    AND cp_competitions.school_id = get_current_user_school_id()
  )
  OR get_current_user_role() = 'admin'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cp_competitions 
    WHERE cp_competitions.id = cp_comp_schools.competition_id 
    AND cp_competitions.school_id = get_current_user_school_id()
  )
  OR get_current_user_role() = 'admin'
);