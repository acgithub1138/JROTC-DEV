-- Continue fixing remaining functions - batch 2

-- Fix clear_stale_email_processing_locks function
CREATE OR REPLACE FUNCTION public.clear_stale_email_processing_locks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  stale_lock_threshold INTERVAL := '15 minutes';
  cleared_locks INTEGER := 0;
BEGIN
  -- Clear locks that are older than 15 minutes
  UPDATE public.email_processing_lock
  SET 
    is_locked = false,
    locked_by = null,
    locked_at = null,
    last_error = 'Lock cleared due to timeout after ' || stale_lock_threshold,
    last_processed_at = now()
  WHERE 
    is_locked = true
    AND locked_at < (now() - stale_lock_threshold);
    
  GET DIAGNOSTICS cleared_locks = ROW_COUNT;
  
  -- Log the cleared locks if any
  IF cleared_locks > 0 THEN
    INSERT INTO public.email_processing_log (
      status,
      processed_count,
      failed_count,
      request_id
    ) VALUES (
      'lock_timeout_cleared',
      cleared_locks,
      0,
      gen_random_uuid()
    );
  END IF;
  
  RETURN cleared_locks;
END;
$function$;

-- Fix encrypt_smtp_password function
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(password_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF password_text IS NULL OR password_text = '' THEN
    RETURN password_text;
  END IF;
  
  -- Use a combination of the password and a salt for encryption
  -- In production, you should use a more secure key management approach
  RETURN encode(
    encrypt(
      password_text::bytea, 
      'smtp_encryption_key_2025'::bytea, 
      'aes'
    ), 
    'base64'
  );
END;
$function$;

-- Fix encrypt_smtp_password_trigger function
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only encrypt if the password appears to be unencrypted
  -- (simple check: if it doesn't look like base64, encrypt it)
  IF NEW.smtp_password IS NOT NULL 
     AND NEW.smtp_password != OLD.smtp_password 
     AND NEW.smtp_password !~ '^[A-Za-z0-9+/]*={0,2}$' THEN
    NEW.smtp_password := encrypt_smtp_password(NEW.smtp_password);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix find_similar_criteria function
CREATE OR REPLACE FUNCTION public.find_similar_criteria(criteria_text text, event_type_param text)
RETURNS TABLE(id uuid, display_name text, original_criteria jsonb, usage_count integer, similarity_score double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.display_name,
    cm.original_criteria,
    cm.usage_count,
    -- Simplified similarity calculation
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(cm.original_criteria) AS criteria_item
        WHERE lower(criteria_item::text) ILIKE '%' || lower(criteria_text) || '%'
      ) THEN 0.8
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(cm.original_criteria) AS criteria_item
        WHERE lower(criteria_item::text) ILIKE '%' || split_part(lower(criteria_text), ' ', 1) || '%'
      ) THEN 0.5
      ELSE 0.1
    END as similarity_score
  FROM public.criteria_mappings cm
  WHERE cm.event_type = event_type_param
    AND (cm.is_global = true OR cm.school_id = get_user_school_id())
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(cm.original_criteria) AS criteria_item
      WHERE lower(criteria_item::text) ILIKE '%' || lower(split_part(criteria_text, ' ', 1)) || '%'
         OR lower(criteria_item::text) ILIKE '%' || lower(criteria_text) || '%'
    )
  ORDER BY similarity_score DESC, usage_count DESC
  LIMIT 5;
END;
$function$;

-- Fix generate_incident_number function
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('public.incident_number_seq') INTO next_num;
    RETURN 'INC' || LPAD(next_num::TEXT, 5, '0');
END;
$function$;