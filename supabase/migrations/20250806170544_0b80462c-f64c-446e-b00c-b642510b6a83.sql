-- Create permission-based RLS helper functions
CREATE OR REPLACE FUNCTION public.current_user_has_permission(module_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN public.check_user_permission(public.get_current_user_id(), module_name, action_name);
END;
$$;

-- Create module-specific helper functions for common operations
CREATE OR REPLACE FUNCTION public.can_manage_budget()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.current_user_has_permission('budget', 'update');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_competitions()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.current_user_has_permission('competitions', 'update');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.current_user_has_permission('email', 'update');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_events()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.current_user_has_permission('calendar', 'update');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_inventory()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.current_user_has_permission('inventory', 'update');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_tasks()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.current_user_has_permission('tasks', 'update');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_job_board()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT public.current_user_has_permission('job_board', 'update');
$$;

-- Add missing permission modules with proper labels
INSERT INTO public.permission_modules (name, label) VALUES 
  ('profiles', 'User Profiles'),
  ('events', 'Events'),
  ('themes', 'Themes'),
  ('pt_tests', 'PT Tests')
ON CONFLICT (name) DO NOTHING;

-- Add missing permission actions with proper labels
INSERT INTO public.permission_actions (name, label) VALUES 
  ('manage', 'Manage')
ON CONFLICT (name) DO NOTHING;

-- Update RLS policies for budget_transactions
DROP POLICY IF EXISTS "Instructors can manage budget transactions in their school" ON public.budget_transactions;
CREATE POLICY "Users with budget permissions can manage budget transactions in their school"
ON public.budget_transactions
FOR ALL
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_budget()
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_budget()
);

-- Update RLS policies for competition_events
DROP POLICY IF EXISTS "Instructors can manage competition events in their school" ON public.competition_events;
CREATE POLICY "Users with competition permissions can manage competition events in their school"
ON public.competition_events
FOR ALL
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_competitions()
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_competitions()
);

-- Update RLS policies for competition_templates
DROP POLICY IF EXISTS "Instructors can create school templates" ON public.competition_templates;
CREATE POLICY "Users with competition permissions can create school templates"
ON public.competition_templates
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_has_permission('competitions', 'create')
  AND created_by = auth.uid() 
  AND school_id = public.get_current_user_school_id() 
  AND is_global = false
);

DROP POLICY IF EXISTS "Schools can update their own templates" ON public.competition_templates;
CREATE POLICY "Users with competition permissions can update their school templates"
ON public.competition_templates
FOR UPDATE
TO authenticated
USING (
  public.can_manage_competitions()
  AND school_id = public.get_current_user_school_id() 
  AND is_global = false
);

DROP POLICY IF EXISTS "Schools can delete their own templates" ON public.competition_templates;
CREATE POLICY "Users with competition permissions can delete their school templates"
ON public.competition_templates
FOR DELETE
TO authenticated
USING (
  public.current_user_has_permission('competitions', 'delete')
  AND school_id = public.get_current_user_school_id() 
  AND is_global = false
);

-- Update RLS policies for competitions
DROP POLICY IF EXISTS "Instructors can manage competitions in their school" ON public.competitions;
CREATE POLICY "Users with competition permissions can manage competitions in their school"
ON public.competitions
FOR ALL
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_competitions()
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_competitions()
);

-- Update RLS policies for email_queue
DROP POLICY IF EXISTS "Instructors can manage email queue in their school" ON public.email_queue;
CREATE POLICY "Users with email permissions can manage email queue in their school"
ON public.email_queue
FOR ALL
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_email()
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_email()
);

-- Update RLS policies for email_rules
DROP POLICY IF EXISTS "Instructors can manage email rules in their school" ON public.email_rules;
CREATE POLICY "Users with email permissions can manage email rules in their school"
ON public.email_rules
FOR ALL
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_email()
);

-- Update RLS policies for email_templates
DROP POLICY IF EXISTS "Instructors can manage email templates in their school" ON public.email_templates;
CREATE POLICY "Users with email permissions can manage email templates in their school"
ON public.email_templates
FOR ALL
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_email()
);

-- Update RLS policies for event_assignments
DROP POLICY IF EXISTS "Instructors can manage event assignments in their school" ON public.event_assignments;
CREATE POLICY "Users with calendar permissions can manage event assignments in their school"
ON public.event_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_assignments.event_id 
      AND events.school_id = public.get_current_user_school_id() 
      AND public.can_manage_events()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_assignments.event_id 
      AND events.school_id = public.get_current_user_school_id() 
      AND public.can_manage_events()
  )
);

-- Update RLS policies for event_types
DROP POLICY IF EXISTS "Instructors can create custom event types for their school" ON public.event_types;
CREATE POLICY "Users with calendar permissions can create custom event types for their school"
ON public.event_types
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND is_default = false 
  AND public.current_user_has_permission('calendar', 'create')
);

DROP POLICY IF EXISTS "Instructors can manage custom event types in their school" ON public.event_types;
CREATE POLICY "Users with calendar permissions can manage custom event types in their school"
ON public.event_types
FOR UPDATE
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND is_default = false 
  AND public.can_manage_events()
);

DROP POLICY IF EXISTS "Instructors can delete custom event types in their school" ON public.event_types;
CREATE POLICY "Users with calendar permissions can delete custom event types in their school"
ON public.event_types
FOR DELETE
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND is_default = false 
  AND public.current_user_has_permission('calendar', 'delete')
);

-- Update RLS policies for events
DROP POLICY IF EXISTS "Instructors can manage events in their school" ON public.events;
CREATE POLICY "Users with calendar permissions can manage events in their school"
ON public.events
FOR ALL
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_events()
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_events()
);

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "Instructors can manage tasks in their school" ON public.tasks;
CREATE POLICY "Users with task permissions can manage tasks in their school"
ON public.tasks
FOR ALL
TO authenticated
USING (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_tasks()
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.can_manage_tasks()
);

-- Update profiles RLS policies for role management
-- Keep admin check for global profile management but add permission-based checks for school-level management
DROP POLICY IF EXISTS "Instructors can update profiles in their school" ON public.profiles;
CREATE POLICY "Users with profile permissions can update profiles in their school"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (school_id = public.get_current_user_school_id() AND public.current_user_has_permission('profiles', 'update'))
  OR public.get_current_user_role() = 'admin'
)
WITH CHECK (
  (school_id = public.get_current_user_school_id() AND public.current_user_has_permission('profiles', 'update'))
  OR public.get_current_user_role() = 'admin'
);