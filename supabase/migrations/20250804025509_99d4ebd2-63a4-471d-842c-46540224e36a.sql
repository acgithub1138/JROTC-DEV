-- Add source_type enum for competition_events
CREATE TYPE competition_source_type AS ENUM ('internal', 'portal');

-- Add new columns to competition_events table
ALTER TABLE public.competition_events 
ADD COLUMN source_type competition_source_type DEFAULT 'internal',
ADD COLUMN source_competition_id uuid;

-- Make competition_id nullable for backward compatibility
ALTER TABLE public.competition_events 
ALTER COLUMN competition_id DROP NOT NULL;

-- Create index for performance
CREATE INDEX idx_competition_events_source ON public.competition_events(source_competition_id, source_type);

-- Migrate existing data
UPDATE public.competition_events 
SET source_type = 'internal', 
    source_competition_id = competition_id 
WHERE competition_id IS NOT NULL;

-- Add constraint to ensure either competition_id or source_competition_id is set
ALTER TABLE public.competition_events 
ADD CONSTRAINT competition_events_source_check 
CHECK (competition_id IS NOT NULL OR source_competition_id IS NOT NULL);