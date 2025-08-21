-- Add foreign key constraint between cp_comp_events and cp_events tables
ALTER TABLE public.cp_comp_events 
ADD CONSTRAINT fk_cp_comp_events_event 
FOREIGN KEY (event) REFERENCES public.cp_events(id) ON DELETE SET NULL;