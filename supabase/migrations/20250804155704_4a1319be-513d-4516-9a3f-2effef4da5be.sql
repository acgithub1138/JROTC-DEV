-- Add school_name column to cp_event_schedules table
ALTER TABLE public.cp_event_schedules 
ADD COLUMN school_name text;

-- Create trigger function to automatically set school_name when scheduling
CREATE OR REPLACE FUNCTION public.set_schedule_school_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Get school name and set it
  SELECT name INTO NEW.school_name
  FROM public.schools
  WHERE id = NEW.school_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger to auto-populate school_name on insert/update
CREATE TRIGGER set_schedule_school_name_trigger
  BEFORE INSERT OR UPDATE OF school_id ON public.cp_event_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_schedule_school_name();

-- Populate existing records
UPDATE public.cp_event_schedules 
SET school_name = schools.name
FROM public.schools 
WHERE cp_event_schedules.school_id = schools.id 
AND cp_event_schedules.school_name IS NULL;