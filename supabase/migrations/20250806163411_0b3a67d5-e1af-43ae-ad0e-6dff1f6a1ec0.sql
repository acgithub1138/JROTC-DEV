-- Optimize remaining RLS policies using security definer functions

-- Update Budget Transactions policies
DROP POLICY IF EXISTS "Authenticated users can view budget transactions from their sch" ON public.budget_transactions;
DROP POLICY IF EXISTS "Instructors can manage budget transactions in their school" ON public.budget_transactions;

CREATE POLICY "Authenticated users can view budget transactions from their school"
ON public.budget_transactions FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage budget transactions in their school"
ON public.budget_transactions FOR ALL
USING (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
);

-- Update Criteria Mappings policies  
DROP POLICY IF EXISTS "Authenticated users can view global and school mappings" ON public.criteria_mappings;
DROP POLICY IF EXISTS "Authenticated users can create mappings for their school" ON public.criteria_mappings;
DROP POLICY IF EXISTS "Authenticated users can update their school mappings" ON public.criteria_mappings;
DROP POLICY IF EXISTS "Admins can manage global mappings" ON public.criteria_mappings;

CREATE POLICY "Authenticated users can view global and school mappings"
ON public.criteria_mappings FOR SELECT
USING (
  is_global = true 
  OR school_id = public.get_current_user_school_id()
);

CREATE POLICY "Authenticated users can create mappings for their school"
ON public.criteria_mappings FOR INSERT
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND created_by = public.get_current_user_id()
);

CREATE POLICY "Authenticated users can update their school mappings"
ON public.criteria_mappings FOR UPDATE
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Admins can manage global mappings"
ON public.criteria_mappings FOR ALL
USING (public.get_current_user_role() = 'admin');

-- Update Default Role Permissions policies
DROP POLICY IF EXISTS "Everyone can view default role permissions" ON public.default_role_permissions;
DROP POLICY IF EXISTS "Only admins can manage default role permissions" ON public.default_role_permissions;

CREATE POLICY "Everyone can view default role permissions"
ON public.default_role_permissions FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage default role permissions"
ON public.default_role_permissions FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Update Email Queue policies
DROP POLICY IF EXISTS "Admins can manage email queue across all schools" ON public.email_queue;
DROP POLICY IF EXISTS "Authenticated users can view email queue in their school" ON public.email_queue;
DROP POLICY IF EXISTS "Instructors can manage email queue in their school" ON public.email_queue;

CREATE POLICY "Authenticated users can view email queue in their school"
ON public.email_queue FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage email queue in their school"
ON public.email_queue FOR ALL
USING (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff'])
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff'])
);

CREATE POLICY "Admins can manage email queue across all schools"
ON public.email_queue FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Update Email Queue Health policies
DROP POLICY IF EXISTS "Admins can view all email queue health" ON public.email_queue_health;
DROP POLICY IF EXISTS "Schools can view their email queue health" ON public.email_queue_health;

CREATE POLICY "Schools can view their email queue health"
ON public.email_queue_health FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Admins can view all email queue health"
ON public.email_queue_health FOR ALL
USING (public.get_current_user_role() = 'admin');

-- Update Email Rule Usage Log policies
DROP POLICY IF EXISTS "Authenticated users can view rule usage logs from their school" ON public.email_rule_usage_log;
DROP POLICY IF EXISTS "System can insert rule usage logs" ON public.email_rule_usage_log;

CREATE POLICY "Authenticated users can view rule usage logs from their school"
ON public.email_rule_usage_log FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "System can insert rule usage logs"
ON public.email_rule_usage_log FOR INSERT
WITH CHECK (school_id = public.get_current_user_school_id());

-- Update Email Rules policies
DROP POLICY IF EXISTS "Authenticated users can view email rules in their school" ON public.email_rules;
DROP POLICY IF EXISTS "Instructors can manage email rules in their school" ON public.email_rules;

CREATE POLICY "Authenticated users can view email rules in their school"
ON public.email_rules FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage email rules in their school"
ON public.email_rules FOR ALL
USING (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
);

-- Update Email Templates policies
DROP POLICY IF EXISTS "Authenticated users can view email templates in their school" ON public.email_templates;
DROP POLICY IF EXISTS "Instructors can manage email templates in their school" ON public.email_templates;

CREATE POLICY "Authenticated users can view email templates in their school"
ON public.email_templates FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage email templates in their school"
ON public.email_templates FOR ALL
USING (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
);