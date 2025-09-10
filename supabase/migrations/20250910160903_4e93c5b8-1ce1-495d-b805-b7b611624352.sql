-- Update clear_password_change_requirement function to also clear temp_pswd
CREATE OR REPLACE FUNCTION public.clear_password_change_requirement()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if user exists
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Update password_change_required and clear temp_pswd field
  UPDATE public.profiles 
  SET password_change_required = false,
      temp_pswd = NULL  -- Clear the temporary password since user has changed it
  WHERE id = current_user_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END;
$$;