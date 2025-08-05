-- Add lunch time columns to cp_comp_events table
ALTER TABLE public.cp_comp_events 
ADD COLUMN lunch_start_time timestamp with time zone,
ADD COLUMN lunch_end_time timestamp with time zone;