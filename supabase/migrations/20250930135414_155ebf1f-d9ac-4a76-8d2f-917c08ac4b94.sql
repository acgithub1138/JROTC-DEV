-- Phase 1: Create optimized views for high-frequency queries

-- View: Competition events with registration counts (eliminates N+1 queries)
CREATE OR REPLACE VIEW public.competition_events_with_registrations AS
SELECT 
  ce.id,
  ce.name,
  ce.description,
  ce.jrotc_program,
  ce.active,
  ce.created_at,
  ce.updated_at,
  ce.created_by,
  ce.school_id,
  ce.score_sheet,
  COALESCE(
    (SELECT COUNT(*)::integer 
     FROM public.cp_event_registrations er 
     WHERE er.event_id = ce.id),
    0
  ) as registration_count
FROM public.cp_events ce;

-- View: Tasks with profile information (reduces join operations)
CREATE OR REPLACE VIEW public.tasks_with_profiles AS
SELECT 
  t.*,
  assigned_to_profile.first_name as assigned_to_first_name,
  assigned_to_profile.last_name as assigned_to_last_name,
  assigned_to_profile.email as assigned_to_email,
  assigned_by_profile.first_name as assigned_by_first_name,
  assigned_by_profile.last_name as assigned_by_last_name,
  assigned_by_profile.email as assigned_by_email
FROM public.tasks t
LEFT JOIN public.profiles assigned_to_profile ON t.assigned_to = assigned_to_profile.id
LEFT JOIN public.profiles assigned_by_profile ON t.assigned_by = assigned_by_profile.id;

-- View: Competition events with all related data
CREATE OR REPLACE VIEW public.cp_comp_events_detailed AS
SELECT 
  ce.id,
  ce.competition_id,
  ce.event,
  ce.school_id,
  ce.start_time,
  ce.end_time,
  ce.location,
  ce.max_participants,
  ce.fee,
  ce.interval,
  ce.score_sheet,
  ce.notes,
  ce.created_at,
  ce.updated_at,
  cet.name as event_name,
  cet.description as event_description,
  COALESCE(
    (SELECT COUNT(*)::integer 
     FROM public.cp_event_registrations er 
     WHERE er.event_id = ce.id),
    0
  ) as registration_count
FROM public.cp_comp_events ce
LEFT JOIN public.cp_events cet ON ce.event = cet.id;

-- Phase 3: Add composite indexes for common query patterns

-- Index for competition events by school and competition
CREATE INDEX IF NOT EXISTS idx_cp_comp_events_school_competition 
ON public.cp_comp_events(school_id, competition_id);

-- Index for event registrations by event (for counting)
CREATE INDEX IF NOT EXISTS idx_cp_event_registrations_event 
ON public.cp_event_registrations(event_id);

-- Index for event registrations by school and competition
CREATE INDEX IF NOT EXISTS idx_cp_event_registrations_school_comp 
ON public.cp_event_registrations(school_id, competition_id);

-- Index for tasks by assigned_to and status (common filter)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status 
ON public.tasks(assigned_to, status);

-- Index for tasks by school and created_at (for pagination)
CREATE INDEX IF NOT EXISTS idx_tasks_school_created 
ON public.tasks(school_id, created_at DESC);

-- Index for competition_events by school and source
CREATE INDEX IF NOT EXISTS idx_competition_events_school_source 
ON public.competition_events(school_id, source_competition_id, source_type);

-- Index for profiles by school and role (common lookup)
CREATE INDEX IF NOT EXISTS idx_profiles_school_role 
ON public.profiles(school_id, role_id);

-- Index for community service by cadet and date
CREATE INDEX IF NOT EXISTS idx_community_service_cadet_date 
ON public.community_service(cadet_id, date DESC);

-- Index for budget transactions by school and date
CREATE INDEX IF NOT EXISTS idx_budget_transactions_school_date 
ON public.budget_transactions(school_id, date DESC);

COMMENT ON VIEW public.competition_events_with_registrations IS 'Optimized view for cp_events with pre-calculated registration counts to eliminate N+1 queries';
COMMENT ON VIEW public.tasks_with_profiles IS 'Optimized view for tasks with profile information to reduce join operations';
COMMENT ON VIEW public.cp_comp_events_detailed IS 'Comprehensive view for competition events with all related data';