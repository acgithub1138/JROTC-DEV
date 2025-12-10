-- Add weight column to competition_event_types table
ALTER TABLE public.competition_event_types
ADD COLUMN weight numeric DEFAULT 1.0 CHECK (weight >= 1.0 AND weight <= 2.0);