-- Update verify_cadet_email_exists to only check for active cadets
CREATE OR REPLACE FUNCTION public.verify_cadet_email_exists(email_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return true if an active cadet email exists (excluding admin and instructor roles)
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE email = email_param 
      AND active = true 
      AND role NOT IN ('admin', 'instructor')
  );
END;
$$;