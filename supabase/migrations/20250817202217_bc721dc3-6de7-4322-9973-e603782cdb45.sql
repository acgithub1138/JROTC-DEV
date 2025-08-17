-- Add calendar_event_id column to cp_comp_schools table
ALTER TABLE public.cp_comp_schools 
ADD COLUMN calendar_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;