-- Optimize triple-filter lookups when assigning schools to time slots
-- This query is called every time a school is dragged to a new time slot
CREATE INDEX IF NOT EXISTS idx_cp_event_schedules_comp_event_school 
ON cp_event_schedules(competition_id, event_id, school_id);

COMMENT ON INDEX idx_cp_event_schedules_comp_event_school IS 
'Optimizes schedule assignment lookups with competition_id + event_id + school_id filters';

-- Optimize active cadet lookups in forms (community service, contacts, etc.)
-- Partial index only includes active cadets to keep index small
CREATE INDEX IF NOT EXISTS idx_profiles_school_active_role_last 
ON profiles(school_id, active, role_id, last_name) 
WHERE active = true;

COMMENT ON INDEX idx_profiles_school_active_role_last IS 
'Optimizes active cadet lookups in forms with school + active + role filters';