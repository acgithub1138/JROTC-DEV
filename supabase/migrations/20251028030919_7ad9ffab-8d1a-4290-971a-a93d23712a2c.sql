-- Fix judge_assignments_view to properly get event data from cp_comp_events
DROP VIEW IF EXISTS judge_assignments_view;

CREATE OR REPLACE VIEW judge_assignments_view AS
SELECT 
  j.user_id,
  j.id as judge_id,
  cj.id as assignment_id,
  cj.competition_id,
  comp.name as competition_name,
  comp.start_date as competition_start_date,
  comp.end_date as competition_end_date,
  comp.status as competition_status,
  comp.location as competition_location,
  cj.event as event_id,
  evt.name as event_name,
  cj.start_time as event_start_time,
  cj.end_time as event_end_time,
  cj.location as event_location,
  cj.assignment_details,
  cj.created_at,
  cj.updated_at
FROM 
  cp_comp_judges cj
  INNER JOIN cp_competitions comp ON cj.competition_id = comp.id
  INNER JOIN cp_judges j ON cj.judge = j.id
  LEFT JOIN cp_comp_events ce ON cj.event = ce.id AND cj.competition_id = ce.competition_id
  LEFT JOIN cp_events evt ON ce.event = evt.id
WHERE 
  comp.status IN ('open', 'in_progress')
ORDER BY 
  comp.start_date ASC,
  cj.start_time ASC;

GRANT SELECT ON judge_assignments_view TO authenticated;