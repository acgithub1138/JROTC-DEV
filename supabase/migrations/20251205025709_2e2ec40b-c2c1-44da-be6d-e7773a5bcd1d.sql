-- Create view for event time requests with all necessary joins
CREATE OR REPLACE VIEW public.cp_event_time_requests AS
SELECT 
  er.id,
  er.competition_id,
  er.school_id,
  er.event_id,
  er.preferred_time_request,
  cs.school_name,
  cs.school_initials,
  ce.event as event_type_id,
  cet.name as event_name,
  cet.initials as event_initials
FROM public.cp_event_registrations er
JOIN public.cp_comp_schools cs ON cs.school_id = er.school_id AND cs.competition_id = er.competition_id
JOIN public.cp_comp_events ce ON ce.id = er.event_id
LEFT JOIN public.competition_event_types cet ON cet.id = ce.event
WHERE er.preferred_time_request IS NOT NULL;