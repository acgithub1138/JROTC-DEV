-- Recreate cp_comp_events_detailed with proper event name join and stable column list/order
DROP VIEW IF EXISTS cp_comp_events_detailed;
CREATE VIEW cp_comp_events_detailed AS
SELECT 
  ce.start_time,
  ce.notes,
  cet.name AS event_name,
  cet.description AS event_description,
  COALESCE(
    (SELECT COUNT(*) 
     FROM cp_event_registrations er 
     WHERE er.event_id = ce.id 
       AND er.competition_id = ce.competition_id
       AND er.status != 'cancelled'),
    0
  )::integer AS registration_count,
  ce.id,
  ce.fee,
  ce.score_sheet,
  ce.max_participants,
  ce.end_time,
  ce.school_id,
  ce.event,
  ce.competition_id,
  ce.interval,
  ce.location,
  ce.created_at,
  ce.updated_at
FROM cp_comp_events ce
LEFT JOIN competition_event_types cet ON cet.id = ce.event;