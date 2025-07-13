-- Update email queue RLS policies to allow admins to queue emails across schools
DROP POLICY IF EXISTS "Instructors can manage email queue in their school" ON email_queue;

-- Allow admins to manage email queue across all schools
CREATE POLICY "Admins can manage email queue across all schools" 
ON email_queue 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Allow instructors to manage email queue in their school
CREATE POLICY "Instructors can manage email queue in their school" 
ON email_queue 
FOR ALL 
USING (
  (school_id = get_current_user_school_id()) AND 
  (get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text]))
)
WITH CHECK (
  (school_id = get_current_user_school_id()) AND 
  (get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text]))
);