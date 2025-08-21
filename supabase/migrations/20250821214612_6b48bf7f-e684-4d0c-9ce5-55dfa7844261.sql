-- Create a secure function to verify cadet email exists for parent registration
-- This function only returns a boolean and excludes admin/instructor roles
-- Uses SECURITY DEFINER to bypass RLS for unauthenticated parent registration
CREATE OR REPLACE FUNCTION public.verify_cadet_email_exists(email_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return true if a cadet email exists (excluding admin and instructor roles)
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE email = email_param 
      AND active = true 
      AND role NOT IN ('admin', 'instructor')
  );
END;
$$;