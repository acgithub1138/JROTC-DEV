-- First, clean up any orphaned references
UPDATE public.cp_comp_events 
SET event = NULL 
WHERE event IS NOT NULL 
AND event NOT IN (SELECT id FROM public.competition_event_types);

-- Add foreign key constraint between cp_comp_events and competition_event_types tables
ALTER TABLE public.cp_comp_events 
DROP CONSTRAINT IF EXISTS fk_cp_comp_events_event;

ALTER TABLE public.cp_comp_events 
ADD CONSTRAINT fk_cp_comp_events_event 
FOREIGN KEY (event) REFERENCES public.competition_event_types(id) ON DELETE SET NULL;