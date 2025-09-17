-- Create the competition registration email data view
CREATE OR REPLACE VIEW public.competition_registration_email_data AS
WITH event_registrations AS (
  SELECT 
    er.competition_id,
    er.school_id,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'event_name', COALESCE(cet.name, 'Unknown Event'),
        'event_fee', COALESCE(ce.fee, 0),
        'event_time', CASE 
          WHEN ce.start_time IS NOT NULL THEN TO_CHAR(ce.start_time, 'MM/DD/YYYY HH12:MI AM')
          ELSE 'TBD'
        END,
        'event_location', COALESCE(ce.location, 'TBD')
      ) ORDER BY cet.name
    ) as events_json,
    COUNT(*) as events_count,
    STRING_AGG(
      '• ' || COALESCE(cet.name, 'Unknown Event') || 
      CASE WHEN ce.fee > 0 THEN ' ($' || ce.fee::text || ')' ELSE '' END,
      E'\n' ORDER BY cet.name
    ) as events_text,
    SUM(COALESCE(ce.fee, 0)) as total_event_fees
  FROM public.cp_event_registrations er
  LEFT JOIN public.cp_comp_events ce ON er.event_id = ce.id
  LEFT JOIN public.competition_event_types cet ON ce.event = cet.id
  WHERE er.status = 'registered'
  GROUP BY er.competition_id, er.school_id
)
SELECT 
  cs.id as registration_id,
  cs.school_id,
  cs.competition_id,
  -- Competition details
  comp.name as competition_name,
  TO_CHAR(comp.start_date, 'MM/DD/YYYY') as competition_start_date,
  TO_CHAR(comp.end_date, 'MM/DD/YYYY') as competition_end_date,
  comp.location as competition_location,
  comp.address as competition_address,
  comp.city as competition_city,
  comp.state as competition_state,
  comp.zip as competition_zip,
  comp.description as competition_description,
  COALESCE(comp.fee, 0) as competition_base_fee,
  comp.hosting_school,
  TO_CHAR(comp.registration_deadline, 'MM/DD/YYYY HH12:MI AM') as registration_deadline,
  -- School details
  COALESCE(cs.school_name, s.name) as school_name,
  cs.school_initials,
  cs.status as registration_status,
  cs.paid as paid_status,
  TO_CHAR(cs.created_at, 'MM/DD/YYYY HH12:MI AM') as registration_date,
  cs.registration_source,
  cs.notes as registration_notes,
  -- Cost calculations
  COALESCE(comp.fee, 0) as base_fee,
  COALESCE(er.total_event_fees, 0) as total_event_fees,
  COALESCE(comp.fee, 0) + COALESCE(er.total_event_fees, 0) as total_cost,
  cs.total_fee as school_calculated_total,
  -- Event details
  COALESCE(er.events_json, '[]'::json) as registered_events_json,
  COALESCE(er.events_count, 0) as registered_events_count,
  COALESCE(er.events_text, 'No events registered') as registered_events_text,
  -- Formatted cost strings
  '$' || COALESCE(comp.fee, 0)::text as base_fee_formatted,
  '$' || COALESCE(er.total_event_fees, 0)::text as event_fees_formatted,
  '$' || (COALESCE(comp.fee, 0) + COALESCE(er.total_event_fees, 0))::text as total_cost_formatted
FROM public.cp_comp_schools cs
LEFT JOIN public.cp_competitions comp ON cs.competition_id = comp.id
LEFT JOIN public.schools s ON cs.school_id = s.id
LEFT JOIN event_registrations er ON cs.competition_id = er.competition_id AND cs.school_id = er.school_id;