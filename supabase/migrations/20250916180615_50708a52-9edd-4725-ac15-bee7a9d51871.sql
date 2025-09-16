-- Create a unified view for competition events with competition details
CREATE OR REPLACE VIEW competition_events_with_competitions AS
-- Internal competitions
SELECT 
  ce.id as competition_event_id,
  ce.school_id,
  ce.event,
  cet.name as event_name,
  ce.competition_id,
  c.name as competition_name,
  c.competition_date,
  'internal' as competition_source,
  ce.score_sheet,
  ce.team_name,
  ce.total_points,
  ce.cadet_ids,
  ce.created_at,
  ce.updated_at
FROM competition_events ce
JOIN competitions c ON ce.competition_id = c.id
JOIN competition_event_types cet ON ce.event = cet.id
WHERE ce.competition_id IS NOT NULL

UNION ALL

-- Portal competitions
SELECT 
  ce.id as competition_event_id,
  ce.school_id,
  ce.event,
  cet.name as event_name,
  ce.source_competition_id as competition_id,
  cp.name as competition_name,
  cp.start_date as competition_date,
  'portal' as competition_source,
  ce.score_sheet,
  ce.team_name,
  ce.total_points,
  ce.cadet_ids,
  ce.created_at,
  ce.updated_at
FROM competition_events ce
JOIN cp_competitions cp ON ce.source_competition_id = cp.id
JOIN competition_event_types cet ON ce.event = cet.id
WHERE ce.source_competition_id IS NOT NULL

UNION ALL

-- Handle data inconsistency: internal competitions incorrectly referenced via source_competition_id
SELECT 
  ce.id as competition_event_id,
  ce.school_id,
  ce.event,
  cet.name as event_name,
  ce.source_competition_id as competition_id,
  c.name as competition_name,
  c.competition_date,
  'internal' as competition_source,
  ce.score_sheet,
  ce.team_name,
  ce.total_points,
  ce.cadet_ids,
  ce.created_at,
  ce.updated_at
FROM competition_events ce
JOIN competitions c ON ce.source_competition_id = c.id
JOIN competition_event_types cet ON ce.event = cet.id
WHERE ce.source_competition_id IS NOT NULL 
  AND ce.competition_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM cp_competitions cp WHERE cp.id = ce.source_competition_id
  );