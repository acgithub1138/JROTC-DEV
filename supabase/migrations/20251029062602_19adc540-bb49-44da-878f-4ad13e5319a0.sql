-- Fix can_link_attachment_to_competition_event to validate against cp_comp_events + cp_comp_schools
CREATE OR REPLACE FUNCTION public.can_link_attachment_to_competition_event(
  _record_id uuid,
  _school_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.cp_comp_events ce
    JOIN public.cp_comp_schools cs
      ON cs.competition_id = ce.competition_id
    WHERE ce.id = _record_id
      AND cs.school_id = _school_id
  );
$$;