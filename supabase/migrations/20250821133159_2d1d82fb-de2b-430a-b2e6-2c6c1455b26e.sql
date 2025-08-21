-- Step 1: Skip table population since data already exists

-- Step 2: Add new columns to reference competition_event_types table
ALTER TABLE public.competition_events 
ADD COLUMN event_type_id UUID REFERENCES public.competition_event_types(id);

ALTER TABLE public.competition_templates 
ADD COLUMN event_type_id UUID REFERENCES public.competition_event_types(id);

-- Step 3: Migrate data from enum to foreign key reference
UPDATE public.competition_events 
SET event_type_id = (
  SELECT id FROM public.competition_event_types 
  WHERE name = competition_events.event::text
);

UPDATE public.competition_templates 
SET event_type_id = (
  SELECT id FROM public.competition_event_types 
  WHERE name = competition_templates.event::text
);

-- Step 4: Make new columns NOT NULL after data migration
ALTER TABLE public.competition_events 
ALTER COLUMN event_type_id SET NOT NULL;

ALTER TABLE public.competition_templates 
ALTER COLUMN event_type_id SET NOT NULL;

-- Step 5: Drop old enum columns
ALTER TABLE public.competition_events 
DROP COLUMN event;

ALTER TABLE public.competition_templates 
DROP COLUMN event;

-- Step 6: Rename new columns to original names
ALTER TABLE public.competition_events 
RENAME COLUMN event_type_id TO event;

ALTER TABLE public.competition_templates 
RENAME COLUMN event_type_id TO event;

-- Step 7: Drop the enum type
DROP TYPE IF EXISTS public.comp_event_type;