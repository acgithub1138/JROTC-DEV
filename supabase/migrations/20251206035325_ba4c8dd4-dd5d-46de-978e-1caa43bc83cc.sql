-- Create a unified view for competition events that includes both
-- internal competitions (via competition_id) and portal competitions (via source_competition_id)
CREATE OR REPLACE VIEW public.competition_events_unified AS
SELECT 
  ce.id,
  ce.school_id,
  ce.event,
  ce.score_sheet,
  ce.total_points,
  ce.team_name,
  ce.cadet_ids,
  ce.judge_transcript,
  ce.source_type,
  ce.created_at,
  ce.updated_at,
  ce.created_by,
  -- Unified competition fields from either source
  COALESCE(ce.competition_id, ce.source_competition_id) as unified_competition_id,
  CASE 
    WHEN ce.source_type = 'portal' THEN cp.name
    ELSE c.name
  END as competition_name,
  CASE 
    WHEN ce.source_type = 'portal' THEN cp.start_date::date
    ELSE c.competition_date
  END as competition_date,
  CASE 
    WHEN ce.source_type = 'portal' THEN cp.location
    ELSE c.location
  END as competition_location,
  -- Keep original IDs for reference
  ce.competition_id,
  ce.source_competition_id
FROM public.competition_events ce
LEFT JOIN public.competitions c ON ce.competition_id = c.id
LEFT JOIN public.cp_competitions cp ON ce.source_competition_id = cp.id;