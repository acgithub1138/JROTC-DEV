-- Fix the event formatting in the email view to use HTML line breaks (corrected)
CREATE OR REPLACE VIEW public.competition_registration_email_data AS
SELECT 
  cs.id as registration_id,
  cs.school_id,
  c.id as competition_id,
  c.name as competition_name,
  c.location as competition_location,
  TO_CHAR(c.start_date, 'MM/DD/YYYY') as competition_start_date,
  TO_CHAR(c.end_date, 'MM/DD/YYYY') as competition_end_date,
  c.address as competition_address,
  c.city as competition_city,
  c.state as competition_state,
  c.zip as competition_zip,
  c.hosting_school,
  c.description as competition_description,
  TO_CHAR(c.registration_deadline, 'MM/DD/YYYY') as registration_deadline,
  s.name as school_name,
  s.initials as school_initials,
  cs.status as registration_status,
  TO_CHAR(cs.created_at, 'MM/DD/YYYY') as registration_date,
  cs.paid as paid_status,
  cs.registration_source,
  cs.notes as registration_notes,
  COALESCE(
    (SELECT COUNT(*) 
     FROM cp_event_registrations er 
     WHERE er.school_id = cs.school_id 
       AND er.competition_id = cs.competition_id
    ), 0
  ) as registered_events_count,
  COALESCE(
    (SELECT json_agg(
       json_build_object(
         'event_name', cet.name,
         'fee', ce.fee
       )
     )
     FROM cp_event_registrations er
     JOIN cp_comp_events ce ON er.event_id = ce.id
     JOIN competition_event_types cet ON ce.event = cet.id
     WHERE er.school_id = cs.school_id 
       AND er.competition_id = cs.competition_id
    ), '[]'::json
  ) as registered_events_json,
  COALESCE(
    (SELECT string_agg(
       '• ' || cet.name || ' ($' || COALESCE(ce.fee::text, '0') || ')',
       '<br>' -- Use HTML line break instead of plain text
     )
     FROM cp_event_registrations er
     JOIN cp_comp_events ce ON er.event_id = ce.id
     JOIN competition_event_types cet ON ce.event = cet.id
     WHERE er.school_id = cs.school_id 
       AND er.competition_id = cs.competition_id
    ), 'No events registered'
  ) as registered_events_text,
  COALESCE(c.fee, 0) as base_fee,
  COALESCE(
    (SELECT SUM(COALESCE(ce.fee, 0))
     FROM cp_event_registrations er
     JOIN cp_comp_events ce ON er.event_id = ce.id
     WHERE er.school_id = cs.school_id 
       AND er.competition_id = cs.competition_id
    ), 0
  ) as total_event_fees,
  COALESCE(c.fee, 0) + COALESCE(
    (SELECT SUM(COALESCE(ce.fee, 0))
     FROM cp_event_registrations er
     JOIN cp_comp_events ce ON er.event_id = ce.id
     WHERE er.school_id = cs.school_id 
       AND er.competition_id = cs.competition_id
    ), 0
  ) as total_cost,
  c.fee as competition_base_fee,
  -- Additional calculated fields for easier template use
  COALESCE(cs.total_fee, 0) as school_calculated_total,
  '$' || COALESCE(c.fee::text, '0') as base_fee_formatted,
  '$' || COALESCE(
    (SELECT SUM(COALESCE(ce.fee, 0))::text
     FROM cp_event_registrations er
     JOIN cp_comp_events ce ON er.event_id = ce.id
     WHERE er.school_id = cs.school_id 
       AND er.competition_id = cs.competition_id
    ), '0'
  ) as event_fees_formatted,
  '$' || (
    COALESCE(c.fee, 0) + COALESCE(
      (SELECT SUM(COALESCE(ce.fee, 0))
       FROM cp_event_registrations er
       JOIN cp_comp_events ce ON er.event_id = ce.id
       WHERE er.school_id = cs.school_id 
         AND er.competition_id = cs.competition_id
      ), 0
    )
  )::text as total_cost_formatted
FROM cp_comp_schools cs
JOIN cp_competitions c ON cs.competition_id = c.id
JOIN schools s ON cs.school_id = s.id;