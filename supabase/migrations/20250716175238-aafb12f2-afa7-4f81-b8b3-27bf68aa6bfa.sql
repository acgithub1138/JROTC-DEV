-- Add job_role_email field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN job_role_email text;

-- Update the email resolution function to use the simplified approach
CREATE OR REPLACE FUNCTION public.resolve_user_email_with_job_priority(user_id_param uuid, school_id_param uuid)
RETURNS TABLE(email text, source text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  profile_email_result TEXT;
  job_role_email_result TEXT;
BEGIN
  -- Get both profile email and job_role_email in one query
  SELECT p.email, p.job_role_email INTO profile_email_result, job_role_email_result
  FROM public.profiles p 
  WHERE p.id = user_id_param;

  -- If user has a job_role_email set, use that first
  IF job_role_email_result IS NOT NULL AND job_role_email_result != '' THEN
    RETURN QUERY SELECT job_role_email_result, 'job_role'::TEXT;
    RETURN;
  END IF;

  -- Fall back to profile email
  IF profile_email_result IS NOT NULL THEN
    RETURN QUERY SELECT profile_email_result, 'profile'::TEXT;
  ELSE
    RETURN QUERY SELECT NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$;