-- Fix remaining functions with missing search_path and create missing functions

-- Create the missing get_stuck_emails function
CREATE OR REPLACE FUNCTION public.get_stuck_emails(threshold_time timestamp with time zone DEFAULT now() - interval '10 minutes')
RETURNS TABLE(
  id uuid,
  recipient_email text,
  subject text,
  body text,
  created_at timestamp with time zone,
  last_attempt_at timestamp with time zone,
  retry_count integer,
  school_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    eq.id,
    eq.recipient_email,
    eq.subject,
    eq.body,
    eq.created_at,
    eq.last_attempt_at,
    eq.retry_count,
    eq.school_id
  FROM public.email_queue eq
  WHERE eq.status = 'processing'
    AND eq.last_attempt_at < threshold_time
    AND eq.retry_count < eq.max_retries;
END;
$function$;

-- Fix update_competition_school_status with proper search_path
CREATE OR REPLACE FUNCTION public.update_competition_school_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- When paid status changes to true, update status to confirmed if it was registered
  IF NEW.paid = true AND OLD.paid = false AND NEW.status = 'registered' THEN
    NEW.status := 'confirmed';
  END IF;
  
  -- When paid status changes to false, update status back to registered if it was confirmed
  IF NEW.paid = false AND OLD.paid = true AND NEW.status = 'confirmed' THEN
    NEW.status := 'registered';
  END IF;
  
  RETURN NEW;
END;
$function$;