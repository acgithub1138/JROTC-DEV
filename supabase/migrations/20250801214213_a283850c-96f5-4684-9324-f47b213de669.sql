-- Create a trigger function to set hosting_school from the school name
CREATE OR REPLACE FUNCTION public.set_hosting_school()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Set hosting_school to the school name based on school_id
  SELECT name INTO NEW.hosting_school
  FROM public.schools
  WHERE id = NEW.school_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set hosting_school on insert
CREATE TRIGGER set_hosting_school_trigger
  BEFORE INSERT ON public.cp_competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_hosting_school();