-- Complete comprehensive fix for ALL remaining functions missing search_path

-- Fix is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Fix populate_comp_schools_names function
CREATE OR REPLACE FUNCTION public.populate_comp_schools_names()
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  UPDATE cp_comp_schools 
  SET school_name = schools.name
  FROM schools 
  WHERE cp_comp_schools.school_id = schools.id 
  AND cp_comp_schools.school_name IS NULL;
END;
$function$;

-- Fix replace_template_variables function
CREATE OR REPLACE FUNCTION public.replace_template_variables(template_text text, data_json jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result_text TEXT;
  key TEXT;
  value TEXT;
BEGIN
  result_text := template_text;
  
  -- Loop through all keys in the JSON object
  FOR key IN SELECT jsonb_object_keys(data_json)
  LOOP
    -- Get the value for this key
    value := COALESCE(data_json ->> key, '');
    
    -- Replace template variables in format {{key}} with the actual value
    result_text := REPLACE(result_text, '{{' || key || '}}', value);
  END LOOP;
  
  RETURN result_text;
END;
$function$;

-- Fix retry_stuck_emails function
CREATE OR REPLACE FUNCTION public.retry_stuck_emails(max_age_minutes integer DEFAULT 10)
RETURNS TABLE(email_id uuid, school_id uuid, retry_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Update stuck emails to retry
  UPDATE public.email_queue
  SET 
    status = 'pending',
    retry_count = retry_count + 1,
    next_retry_at = now() + (INTERVAL '5 minutes' * retry_count),
    last_attempt_at = now(),
    error_message = COALESCE(error_message, '') || ' | Retried at ' || now()::text,
    updated_at = now()
  WHERE status = 'pending'
    AND created_at < (now() - (max_age_minutes || ' minutes')::INTERVAL)
    AND retry_count < max_retries
    AND (next_retry_at IS NULL OR next_retry_at <= now());

  -- Return the retried emails
  RETURN QUERY 
  SELECT eq.id, eq.school_id, eq.retry_count
  FROM public.email_queue eq
  WHERE eq.last_attempt_at >= (now() - INTERVAL '1 minute')
    AND eq.retry_count > 0;
END;
$function$;

-- Fix set_comp_school_name function
CREATE OR REPLACE FUNCTION public.set_comp_school_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Get school name and set it (using full schema prefix)
  SELECT name INTO NEW.school_name
  FROM public.schools
  WHERE id = NEW.school_id;
  
  RETURN NEW;
END;
$function$;

-- Fix set_hosting_school function
CREATE OR REPLACE FUNCTION public.set_hosting_school()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Set hosting_school to the school name based on school_id
  SELECT name INTO NEW.hosting_school
  FROM public.schools
  WHERE id = NEW.school_id;
  
  RETURN NEW;
END;
$function$;

-- Fix set_schedule_school_name function
CREATE OR REPLACE FUNCTION public.set_schedule_school_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Get school name and set it
  SELECT name INTO NEW.school_name
  FROM public.schools
  WHERE id = NEW.school_id;
  
  RETURN NEW;
END;
$function$;

-- Fix validate_task_priority function
CREATE OR REPLACE FUNCTION public.validate_task_priority(priority_value text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.task_priority_options 
    WHERE value = priority_value AND is_active = true
  );
END;
$function$;

-- Fix validate_task_status function
CREATE OR REPLACE FUNCTION public.validate_task_status(status_value text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.task_status_options 
    WHERE value = status_value AND is_active = true
  );
END;
$function$;