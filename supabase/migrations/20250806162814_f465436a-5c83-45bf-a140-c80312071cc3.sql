-- Create additional security definer functions for better RLS performance
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT auth.uid();
$$;

-- Optimize existing functions to use the new pattern
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT ur.role_name 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = public.get_current_user_id();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT school_id FROM public.profiles WHERE id = public.get_current_user_id();
$$;

-- Drop and recreate RLS policies with optimized auth.uid() usage

-- Budget Transactions policies
DROP POLICY IF EXISTS "Authenticated users can create budget transactions for their sc" ON public.budget_transactions;
DROP POLICY IF EXISTS "Authenticated users can delete budget transactions from their s" ON public.budget_transactions;
DROP POLICY IF EXISTS "Authenticated users can update budget transactions from their s" ON public.budget_transactions;
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

-- Competition Event Types policies
DROP POLICY IF EXISTS "Admins can manage all event types" ON public.competition_event_types;
DROP POLICY IF EXISTS "Authenticated users can create event types" ON public.competition_event_types;
DROP POLICY IF EXISTS "Everyone can view active event types" ON public.competition_event_types;

CREATE POLICY "Everyone can view active event types"
ON public.competition_event_types FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can create event types"
ON public.competition_event_types FOR INSERT
WITH CHECK (created_by = public.get_current_user_id());

CREATE POLICY "Admins can manage all event types"
ON public.competition_event_types FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Competition Events policies
DROP POLICY IF EXISTS "Authenticated users can view competition events from their scho" ON public.competition_events;
DROP POLICY IF EXISTS "Instructors can manage competition events in their school" ON public.competition_events;

CREATE POLICY "Authenticated users can view competition events from their school"
ON public.competition_events FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage competition events in their school"
ON public.competition_events FOR ALL
USING (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
);

-- Competition Results policies
DROP POLICY IF EXISTS "School data isolation" ON public.competition_results;

CREATE POLICY "School data isolation"
ON public.competition_results FOR ALL
USING (school_id = public.get_current_user_school_id());

-- Competition Templates policies
DROP POLICY IF EXISTS "Admins can create any templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Admins can delete global templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Admins can update global templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Anyone can view active global templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Instructors can create school templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Schools can delete their own templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Schools can update their own templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Schools can view their own templates" ON public.competition_templates;

CREATE POLICY "Anyone can view active global templates"
ON public.competition_templates FOR SELECT
USING (is_active = true AND is_global = true);

CREATE POLICY "Schools can view their own templates"
ON public.competition_templates FOR SELECT
USING (is_active = true AND school_id = public.get_current_user_school_id());

CREATE POLICY "Admins can view all templates"
ON public.competition_templates FOR SELECT
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Instructors can create school templates"
ON public.competition_templates FOR INSERT
WITH CHECK (
  public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff']) 
  AND created_by = public.get_current_user_id() 
  AND school_id = public.get_current_user_school_id() 
  AND is_global = false
);

CREATE POLICY "Admins can create any templates"
ON public.competition_templates FOR INSERT
WITH CHECK (
  public.get_current_user_role() = 'admin' 
  AND created_by = public.get_current_user_id()
);

CREATE POLICY "Schools can update their own templates"
ON public.competition_templates FOR UPDATE
USING (
  public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff']) 
  AND school_id = public.get_current_user_school_id() 
  AND is_global = false
);

CREATE POLICY "Schools can delete their own templates"
ON public.competition_templates FOR DELETE
USING (
  public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff']) 
  AND school_id = public.get_current_user_school_id() 
  AND is_global = false
);

CREATE POLICY "Admins can update global templates"
ON public.competition_templates FOR UPDATE
USING (public.get_current_user_role() = 'admin' AND is_global = true)
WITH CHECK (public.get_current_user_role() = 'admin' AND is_global = true);

CREATE POLICY "Admins can delete global templates"
ON public.competition_templates FOR DELETE
USING (public.get_current_user_role() = 'admin' AND is_global = true);

-- Competitions policies
DROP POLICY IF EXISTS "Authenticated users can view competitions from their school" ON public.competitions;
DROP POLICY IF EXISTS "Instructors can manage competitions in their school" ON public.competitions;

CREATE POLICY "Authenticated users can view competitions from their school"
ON public.competitions FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage competitions in their school"
ON public.competitions FOR ALL
USING (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
)
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND public.get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
);

-- Contacts policies
DROP POLICY IF EXISTS "Authenticated users can manage contacts in their school" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts from their school" ON public.contacts;
DROP POLICY IF EXISTS "School data isolation" ON public.contacts;

CREATE POLICY "Authenticated users can view contacts from their school"
ON public.contacts FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Authenticated users can manage contacts in their school"
ON public.contacts FOR ALL
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

-- CP Competition Events policies
DROP POLICY IF EXISTS "Admins can manage all comp events" ON public.cp_comp_events;
DROP POLICY IF EXISTS "Authenticated users can view comp events" ON public.cp_comp_events;
DROP POLICY IF EXISTS "Hosting schools can manage their comp events" ON public.cp_comp_events;

CREATE POLICY "Authenticated users can view comp events"
ON public.cp_comp_events FOR SELECT
USING ((SELECT public.get_current_user_id()) IS NOT NULL);

CREATE POLICY "Hosting schools can manage their comp events"
ON public.cp_comp_events FOR ALL
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Admins can manage all comp events"
ON public.cp_comp_events FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CP Competition Resources policies
DROP POLICY IF EXISTS "Admins can manage all comp resources" ON public.cp_comp_resources;
DROP POLICY IF EXISTS "Hosting schools can manage their comp resources" ON public.cp_comp_resources;

CREATE POLICY "Hosting schools can manage their comp resources"
ON public.cp_comp_resources FOR ALL
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Admins can manage all comp resources"
ON public.cp_comp_resources FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CP Competition Schools policies - Optimize complex EXISTS queries
DROP POLICY IF EXISTS "Admins can manage all comp schools" ON public.cp_comp_schools;
DROP POLICY IF EXISTS "Hosting schools and admins can manage all registrations for the" ON public.cp_comp_schools;
DROP POLICY IF EXISTS "Schools can delete their own registrations" ON public.cp_comp_schools;
DROP POLICY IF EXISTS "Schools can register for competitions" ON public.cp_comp_schools;
DROP POLICY IF EXISTS "Schools can update their own registrations" ON public.cp_comp_schools;
DROP POLICY IF EXISTS "Schools can view registrations for their competitions or their" ON public.cp_comp_schools;

CREATE POLICY "Schools can register for competitions"
ON public.cp_comp_schools FOR INSERT
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Schools can update their own registrations"
ON public.cp_comp_schools FOR UPDATE
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Schools can delete their own registrations"
ON public.cp_comp_schools FOR DELETE
USING (school_id = public.get_current_user_school_id());

-- Optimized view policy with subquery
CREATE POLICY "Schools can view registrations for their competitions or their own"
ON public.cp_comp_schools FOR SELECT
USING (
  school_id = public.get_current_user_school_id() 
  OR public.get_current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.cp_competitions c 
    WHERE c.id = cp_comp_schools.competition_id 
    AND c.school_id = public.get_current_user_school_id()
  )
);

-- Optimized admin/hosting management policy
CREATE POLICY "Hosting schools and admins can manage all registrations"
ON public.cp_comp_schools FOR ALL
USING (
  public.get_current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.cp_competitions c 
    WHERE c.id = cp_comp_schools.competition_id 
    AND c.school_id = public.get_current_user_school_id()
  )
)
WITH CHECK (
  public.get_current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.cp_competitions c 
    WHERE c.id = cp_comp_schools.competition_id 
    AND c.school_id = public.get_current_user_school_id()
  )
);

-- CP Competitions policies
DROP POLICY IF EXISTS "Admins can manage all competitions" ON public.cp_competitions;
DROP POLICY IF EXISTS "Everyone can view public competitions" ON public.cp_competitions;
DROP POLICY IF EXISTS "Hosting schools can manage their competitions" ON public.cp_competitions;

CREATE POLICY "Everyone can view public competitions"
ON public.cp_competitions FOR SELECT
USING (is_public = true);

CREATE POLICY "Hosting schools can manage their competitions"
ON public.cp_competitions FOR ALL
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Admins can manage all competitions"
ON public.cp_competitions FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');