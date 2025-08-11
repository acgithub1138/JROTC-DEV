-- Create function to clear password change requirement
CREATE OR REPLACE FUNCTION public.clear_password_change_requirement()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update the current user's profile to clear password change requirement
  UPDATE public.profiles 
  SET password_change_required = false, updated_at = now()
  WHERE id = auth.uid();
  
  -- Raise an exception if no rows were updated (user not found)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found or not authorized';
  END IF;
END;
$$;