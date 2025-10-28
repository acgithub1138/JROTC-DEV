-- Create function to nullify school_id for judges
CREATE OR REPLACE FUNCTION public.nullify_judge_school_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If the role is 'judge', set school_id to NULL
  IF NEW.role = 'judge' THEN
    NEW.school_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically nullify school_id for judges
DROP TRIGGER IF EXISTS nullify_judge_school_trigger ON public.profiles;

CREATE TRIGGER nullify_judge_school_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.nullify_judge_school_id();