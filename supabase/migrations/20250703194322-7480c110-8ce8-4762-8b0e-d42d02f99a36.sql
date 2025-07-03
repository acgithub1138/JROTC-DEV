-- Add overall placement columns to competitions table
ALTER TABLE public.competitions 
ADD COLUMN overall_placement public.comp_placement,
ADD COLUMN overall_armed_placement public.comp_placement,
ADD COLUMN overall_unarmed_placement public.comp_placement;