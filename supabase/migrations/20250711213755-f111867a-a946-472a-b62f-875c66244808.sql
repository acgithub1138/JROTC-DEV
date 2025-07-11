-- Remove ALL existing RLS policies for incidents and incident_comments tables
DROP POLICY IF EXISTS "Admins and school users can view incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can view all incidents" ON public.incidents;
DROP POLICY IF EXISTS "Non-admins can view incidents from their school" ON public.incidents;
DROP POLICY IF EXISTS "Only instructors can create incidents for their school" ON public.incidents;
DROP POLICY IF EXISTS "Users can update their own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can update any incident" ON public.incidents;
DROP POLICY IF EXISTS "Admins can delete incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can view incidents from their school or admins can view all" ON public.incidents;
DROP POLICY IF EXISTS "School-based incident visibility with admin override" ON public.incidents;
DROP POLICY IF EXISTS "Admins can view all incidents (fallback)" ON public.incidents;
DROP POLICY IF EXISTS "Users can view incidents from their school (fallback)" ON public.incidents;

DROP POLICY IF EXISTS "Users can view incident comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Users can create incident comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Users can update their own incident comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Users can delete their own incident comments" ON public.incident_comments;

-- Create new, simple RLS policies for incidents
-- SELECT: Admins see all incidents, non-admins see only their school's incidents
CREATE POLICY "Incident visibility" 
ON public.incidents 
FOR SELECT 
USING (
  get_current_user_role() = 'admin' OR 
  school_id = get_current_user_school_id()
);

-- INSERT: Only instructors+ can create incidents for their school
CREATE POLICY "Instructors can create incidents" 
ON public.incidents 
FOR INSERT 
WITH CHECK (
  school_id = get_current_user_school_id() AND 
  submitted_by = auth.uid() AND
  get_current_user_role() = ANY(ARRAY['instructor', 'admin'])
);

-- UPDATE: Admins can update any incident, instructors can update incidents in their school, users can update their own
CREATE POLICY "Incident updates" 
ON public.incidents 
FOR UPDATE 
USING (
  get_current_user_role() = 'admin' OR
  (school_id = get_current_user_school_id() AND get_current_user_role() = 'instructor') OR
  (submitted_by = auth.uid() AND school_id = get_current_user_school_id())
);

-- DELETE: Only admins can delete incidents
CREATE POLICY "Admins can delete incidents" 
ON public.incidents 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- Create matching policies for incident_comments
-- SELECT: Same visibility as incidents
CREATE POLICY "Comment visibility" 
ON public.incident_comments 
FOR SELECT 
USING (
  get_current_user_role() = 'admin' OR
  EXISTS (
    SELECT 1 FROM incidents 
    WHERE incidents.id = incident_comments.incident_id 
    AND incidents.school_id = get_current_user_school_id()
  )
);

-- INSERT: Users can comment on incidents they can see
CREATE POLICY "Users can create comments" 
ON public.incident_comments 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  (
    get_current_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_comments.incident_id 
      AND incidents.school_id = get_current_user_school_id()
    )
  )
);

-- UPDATE: Users can update their own comments
CREATE POLICY "Users can update own comments" 
ON public.incident_comments 
FOR UPDATE 
USING (
  user_id = auth.uid() AND
  (
    get_current_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_comments.incident_id 
      AND incidents.school_id = get_current_user_school_id()
    )
  )
);

-- DELETE: Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
ON public.incident_comments 
FOR DELETE 
USING (
  user_id = auth.uid() AND
  (
    get_current_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM incidents 
      WHERE incidents.id = incident_comments.incident_id 
      AND incidents.school_id = get_current_user_school_id()
    )
  )
);