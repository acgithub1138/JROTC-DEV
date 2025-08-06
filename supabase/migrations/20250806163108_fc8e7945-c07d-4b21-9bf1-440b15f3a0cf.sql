-- Continue optimizing remaining RLS policies

-- CP Event Registrations policies
DROP POLICY IF EXISTS "Admins can manage all event registrations" ON public.cp_event_registrations;
DROP POLICY IF EXISTS "Hosting schools can view all registrations for their competitio" ON public.cp_event_registrations;
DROP POLICY IF EXISTS "Schools can delete their event registrations" ON public.cp_event_registrations;
DROP POLICY IF EXISTS "Schools can register for events" ON public.cp_event_registrations;
DROP POLICY IF EXISTS "Schools can update their event registrations" ON public.cp_event_registrations;
DROP POLICY IF EXISTS "Schools can view their event registrations" ON public.cp_event_registrations;

CREATE POLICY "Schools can view their event registrations"
ON public.cp_event_registrations FOR SELECT
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Schools can register for events"
ON public.cp_event_registrations FOR INSERT
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Schools can update their event registrations"
ON public.cp_event_registrations FOR UPDATE
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Schools can delete their event registrations"
ON public.cp_event_registrations FOR DELETE
USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Hosting schools can view all registrations for their competitions"
ON public.cp_event_registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.cp_competitions c 
    WHERE c.id = cp_event_registrations.competition_id 
    AND c.school_id = public.get_current_user_school_id()
  )
);

CREATE POLICY "Admins can manage all event registrations"
ON public.cp_event_registrations FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CP Event Schedules policies
DROP POLICY IF EXISTS "Admins can manage all event schedules" ON public.cp_event_schedules;
DROP POLICY IF EXISTS "Authenticated users can view event schedules" ON public.cp_event_schedules;
DROP POLICY IF EXISTS "Hosting schools can manage schedules for their competitions" ON public.cp_event_schedules;
DROP POLICY IF EXISTS "Registered schools can create their own schedules" ON public.cp_event_schedules;

CREATE POLICY "Authenticated users can view event schedules"
ON public.cp_event_schedules FOR SELECT
USING ((SELECT public.get_current_user_id()) IS NOT NULL);

CREATE POLICY "Registered schools can create their own schedules"
ON public.cp_event_schedules FOR INSERT
WITH CHECK (
  school_id = public.get_current_user_school_id() 
  AND EXISTS (
    SELECT 1 FROM public.cp_comp_schools cs 
    WHERE cs.competition_id = cp_event_schedules.competition_id 
    AND cs.school_id = cp_event_schedules.school_id
  )
);

CREATE POLICY "Hosting schools can manage schedules for their competitions"
ON public.cp_event_schedules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cp_competitions c 
    WHERE c.id = cp_event_schedules.competition_id 
    AND c.school_id = public.get_current_user_school_id()
  )
);

CREATE POLICY "Admins can manage all event schedules"
ON public.cp_event_schedules FOR ALL
USING (public.get_current_user_role() = 'admin');

-- CP Events policies
DROP POLICY IF EXISTS "Admins can manage all events" ON public.cp_events;
DROP POLICY IF EXISTS "Authenticated users can view all active events" ON public.cp_events;
DROP POLICY IF EXISTS "Hosting schools can manage their events" ON public.cp_events;

CREATE POLICY "Authenticated users can view all active events"
ON public.cp_events FOR SELECT
USING (active = true);

CREATE POLICY "Hosting schools can manage their events"
ON public.cp_events FOR ALL
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Admins can manage all events"
ON public.cp_events FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- CP Judges policies
DROP POLICY IF EXISTS "Hosting schools can manage their judges" ON public.cp_judges;

CREATE POLICY "Hosting schools can manage their judges"
ON public.cp_judges FOR ALL
USING (school_id = public.get_current_user_school_id())
WITH CHECK (school_id = public.get_current_user_school_id());

-- Criteria Mappings policies
DROP POLICY IF EXISTS "Admins can manage global mappings" ON public.criteria_mappings;
DROP POLICY IF EXISTS "Authenticated users can create mappings for their school" ON public.criteria_mappings;
DROP POLICY IF EXISTS "Authenticated users can update their school mappings" ON public.criteria_mappings;
DROP POLICY IF EXISTS "Authenticated users can view global and school mappings" ON public.criteria_mappings;

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