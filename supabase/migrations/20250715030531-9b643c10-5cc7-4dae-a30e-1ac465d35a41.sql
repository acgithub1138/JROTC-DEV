-- Create trigger function to handle graduate status
CREATE OR REPLACE FUNCTION public.handle_graduate_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if grade changed to 'Graduate'
  IF OLD.grade IS DISTINCT FROM NEW.grade AND NEW.grade = 'Graduate' THEN
    -- Set active to false and flight to null for graduates
    NEW.active := false;
    NEW.flight := null;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to execute before profile updates
CREATE TRIGGER handle_graduate_status_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_graduate_status();