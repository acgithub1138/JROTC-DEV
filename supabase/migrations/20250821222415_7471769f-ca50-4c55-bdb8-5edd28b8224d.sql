CREATE OR REPLACE FUNCTION public.get_cadet_info_for_parent_registration(email_param text)
RETURNS TABLE(cadet_exists boolean, school_id uuid, cadet_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Return cadet info if exists and is active (excluding admin and instructor roles)
  RETURN QUERY
  SELECT 
    true as cadet_exists,
    p.school_id,
    p.id as cadet_id
  FROM public.profiles p 
  WHERE p.email = email_param 
    AND p.active = true 
    AND p.role NOT IN ('admin', 'instructor')
  LIMIT 1;
  
  -- If no rows returned, return false with nulls
  IF NOT FOUND THEN
    RETURN QUERY SELECT false as cadet_exists, null::uuid as school_id, null::uuid as cadet_id;
  END IF;
END;
$function$