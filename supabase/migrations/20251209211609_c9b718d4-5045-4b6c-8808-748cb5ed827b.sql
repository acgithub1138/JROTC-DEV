-- Add category column to competition_event_types
ALTER TABLE public.competition_event_types 
ADD COLUMN category text NOT NULL DEFAULT 'other';

-- Update existing events based on their names
UPDATE public.competition_event_types
SET category = CASE
  WHEN name ILIKE 'Armed%' OR name ILIKE 'AR-%' THEN 'armed'
  WHEN name ILIKE 'Unarmed%' OR name ILIKE 'UAR-%' THEN 'unarmed'
  ELSE 'other'
END;

-- Add check constraint for valid categories
ALTER TABLE public.competition_event_types
ADD CONSTRAINT competition_event_types_category_check 
CHECK (category IN ('armed', 'unarmed', 'other'));