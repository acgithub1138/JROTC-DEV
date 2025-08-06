-- Restrict RLS policies from public to authenticated for sensitive data tables

-- Drop existing policies that use public role and recreate with authenticated role

-- Budget Transactions
DROP POLICY IF EXISTS "Users can view budget transactions from their school" ON public.budget_transactions;
DROP POLICY IF EXISTS "Users can create budget transactions for their school" ON public.budget_transactions;
DROP POLICY IF EXISTS "Users can update budget transactions from their school" ON public.budget_transactions;
DROP POLICY IF EXISTS "Users can delete budget transactions from their school" ON public.budget_transactions;

CREATE POLICY "Authenticated users can view budget transactions from their school"
ON public.budget_transactions FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

CREATE POLICY "Authenticated users can create budget transactions for their school"
ON public.budget_transactions FOR INSERT
TO authenticated
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Authenticated users can update budget transactions from their school"
ON public.budget_transactions FOR UPDATE
TO authenticated
USING (school_id = get_current_user_school_id());

CREATE POLICY "Authenticated users can delete budget transactions from their school"
ON public.budget_transactions FOR DELETE
TO authenticated
USING (school_id = get_current_user_school_id());

-- Competition Events
DROP POLICY IF EXISTS "Users can view competition events from their school" ON public.competition_events;

CREATE POLICY "Authenticated users can view competition events from their school"
ON public.competition_events FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

-- Competitions
DROP POLICY IF EXISTS "Users can view competitions from their school" ON public.competitions;

CREATE POLICY "Authenticated users can view competitions from their school"
ON public.competitions FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

-- Contacts
DROP POLICY IF EXISTS "Users can view contacts from their school" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage contacts in their school" ON public.contacts;

CREATE POLICY "Authenticated users can view contacts from their school"
ON public.contacts FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

CREATE POLICY "Authenticated users can manage contacts in their school"
ON public.contacts FOR ALL
TO authenticated
USING (school_id = get_current_user_school_id());

-- CP Comp Events
DROP POLICY IF EXISTS "All users can view comp events" ON public.cp_comp_events;

CREATE POLICY "Authenticated users can view comp events"
ON public.cp_comp_events FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- CP Event Schedules
DROP POLICY IF EXISTS "All users can view event schedules" ON public.cp_event_schedules;

CREATE POLICY "Authenticated users can view event schedules"
ON public.cp_event_schedules FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- CP Events
DROP POLICY IF EXISTS "All users can view all active events" ON public.cp_events;

CREATE POLICY "Authenticated users can view all active events"
ON public.cp_events FOR SELECT
TO authenticated
USING (active = true);

-- Email Queue
DROP POLICY IF EXISTS "Users can view email queue in their school" ON public.email_queue;

CREATE POLICY "Authenticated users can view email queue in their school"
ON public.email_queue FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

-- Email Templates
DROP POLICY IF EXISTS "Users can view email templates in their school" ON public.email_templates;

CREATE POLICY "Authenticated users can view email templates in their school"
ON public.email_templates FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

-- Email Rules
DROP POLICY IF EXISTS "Users can view email rules in their school" ON public.email_rules;

CREATE POLICY "Authenticated users can view email rules in their school"
ON public.email_rules FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

-- Email Rule Usage Log
DROP POLICY IF EXISTS "Users can view rule usage logs from their school" ON public.email_rule_usage_log;

CREATE POLICY "Authenticated users can view rule usage logs from their school"
ON public.email_rule_usage_log FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

-- Event Assignments
DROP POLICY IF EXISTS "Users can view event assignments from their school" ON public.event_assignments;

CREATE POLICY "Authenticated users can view event assignments from their school"
ON public.event_assignments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM events
  WHERE events.id = event_assignments.event_id 
  AND events.school_id = get_current_user_school_id()
));

-- Event Types
DROP POLICY IF EXISTS "Users can view global and school event types" ON public.event_types;

CREATE POLICY "Authenticated users can view global and school event types"
ON public.event_types FOR SELECT
TO authenticated
USING ((school_id IS NULL) OR (school_id = get_current_user_school_id()));

-- Events
DROP POLICY IF EXISTS "Users can view events from their school" ON public.events;

CREATE POLICY "Authenticated users can view events from their school"
ON public.events FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

-- Expenses
DROP POLICY IF EXISTS "Users can view expenses from their school" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage expenses in their school" ON public.expenses;

CREATE POLICY "Authenticated users can view expenses from their school"
ON public.expenses FOR SELECT
TO authenticated
USING (school_id = get_current_user_school_id());

CREATE POLICY "Authenticated users can manage expenses in their school"
ON public.expenses FOR ALL
TO authenticated
USING (school_id = get_current_user_school_id());

-- Criteria Mappings
DROP POLICY IF EXISTS "Users can view global and school mappings" ON public.criteria_mappings;
DROP POLICY IF EXISTS "Users can create mappings for their school" ON public.criteria_mappings;
DROP POLICY IF EXISTS "Users can update their school mappings" ON public.criteria_mappings;

CREATE POLICY "Authenticated users can view global and school mappings"
ON public.criteria_mappings FOR SELECT
TO authenticated
USING ((is_global = true) OR (school_id = get_current_user_school_id()));

CREATE POLICY "Authenticated users can create mappings for their school"
ON public.criteria_mappings FOR INSERT
TO authenticated
WITH CHECK ((school_id = get_current_user_school_id()) AND (created_by = auth.uid()));

CREATE POLICY "Authenticated users can update their school mappings"
ON public.criteria_mappings FOR UPDATE
TO authenticated
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());

-- Keep legitimate public access for certain tables
-- Competition Event Types - Keep public access for viewing active default types
-- CP Competitions - Keep public access for viewing public competitions
-- Competition Templates - Keep public access for viewing active global templates

-- Update policy names and ensure proper authentication checks
DROP POLICY IF EXISTS "Authenticated users can create event types" ON public.competition_event_types;

CREATE POLICY "Authenticated users can create event types"
ON public.competition_event_types FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Ensure profiles table policies are properly restricted
-- (Note: profiles table policies should already be using authenticated role based on the functions used)