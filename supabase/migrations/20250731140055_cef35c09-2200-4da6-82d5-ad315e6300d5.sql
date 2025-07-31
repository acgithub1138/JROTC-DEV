-- Remove competition_id column from cp_events table
ALTER TABLE public.cp_events DROP COLUMN IF EXISTS competition_id;