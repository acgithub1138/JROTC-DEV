-- Create cp_comp_judges table (mirror of cp_comp_resources but for judges)
CREATE TABLE IF NOT EXISTS public.cp_comp_judges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  competition_id UUID NOT NULL,
  judge UUID NOT NULL,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  assignment_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS on cp_comp_judges
ALTER TABLE public.cp_comp_judges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cp_comp_judges (mirror cp_comp_resources policies)
CREATE POLICY "cp_comp_judges: create"
ON public.cp_comp_judges
FOR INSERT
TO authenticated
WITH CHECK (
  is_current_user_admin_role() OR 
  (can_user_access('cp_comp_judges', 'create') AND is_user_in_school(school_id))
);

CREATE POLICY "cp_comp_judges: read access"
ON public.cp_comp_judges
FOR SELECT
TO authenticated
USING (
  is_current_user_admin_role() OR 
  can_user_access('cp_comp_judges', 'read')
);

CREATE POLICY "cp_comp_judges: update"
ON public.cp_comp_judges
FOR UPDATE
TO authenticated
USING (
  is_current_user_admin_role() OR 
  (can_user_access('cp_comp_judges', 'update') AND is_user_in_school(school_id))
)
WITH CHECK (
  is_current_user_admin_role() OR 
  (can_user_access('cp_comp_judges', 'update') AND is_user_in_school(school_id))
);

CREATE POLICY "cp_comp_judges: delete"
ON public.cp_comp_judges
FOR DELETE
TO authenticated
USING (
  is_current_user_admin_role() OR 
  (can_user_access('cp_comp_judges', 'delete') AND is_user_in_school(school_id))
);

-- Drop view first before removing columns
DROP VIEW IF EXISTS public.cp_comp_events_detailed CASCADE;

-- Now remove judges and resources columns from cp_comp_events
ALTER TABLE public.cp_comp_events 
DROP COLUMN IF EXISTS judges,
DROP COLUMN IF EXISTS resources;

-- Recreate cp_comp_events_detailed view without judges and resources
CREATE OR REPLACE VIEW public.cp_comp_events_detailed AS
SELECT 
  ce.id,
  ce.school_id,
  ce.competition_id,
  ce.event,
  ce.location,
  ce.start_time,
  ce.end_time,
  ce.max_participants,
  ce.fee,
  ce.score_sheet,
  ce.interval,
  ce.notes,
  ce.created_at,
  ce.updated_at,
  cet.name as event_name,
  cet.description as event_description,
  COUNT(DISTINCT er.id)::integer as registration_count
FROM public.cp_comp_events ce
LEFT JOIN public.competition_event_types cet ON ce.event = cet.id
LEFT JOIN public.cp_event_registrations er ON ce.id = er.event_id AND er.status != 'canceled'
GROUP BY 
  ce.id,
  ce.school_id,
  ce.competition_id,
  ce.event,
  ce.location,
  ce.start_time,
  ce.end_time,
  ce.max_participants,
  ce.fee,
  ce.score_sheet,
  ce.interval,
  ce.notes,
  ce.created_at,
  ce.updated_at,
  cet.name,
  cet.description;