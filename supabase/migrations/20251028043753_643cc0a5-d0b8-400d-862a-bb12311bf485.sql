-- Add created_by field to competition_events table
ALTER TABLE public.competition_events 
ADD COLUMN created_by uuid REFERENCES auth.users(id);