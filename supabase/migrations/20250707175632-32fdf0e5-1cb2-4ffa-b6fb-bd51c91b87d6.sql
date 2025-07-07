-- Remove severity column from incidents table
ALTER TABLE public.incidents DROP COLUMN IF EXISTS severity;