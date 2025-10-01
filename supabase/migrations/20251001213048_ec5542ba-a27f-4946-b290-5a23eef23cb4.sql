-- Add event field to cp_comp_judges table
ALTER TABLE public.cp_comp_judges 
ADD COLUMN event uuid REFERENCES public.cp_comp_events(id) ON DELETE SET NULL;