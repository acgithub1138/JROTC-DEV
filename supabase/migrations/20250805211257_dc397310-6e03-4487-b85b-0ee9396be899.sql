-- Simplify the email rules trigger to reduce complexity and prevent bugs
-- This removes the complex logic that was causing issues with duplicate emails

CREATE OR REPLACE FUNCTION public.process_email_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  queue_item_id UUID;
  rule_record RECORD;
BEGIN
  -- Simple logging for debugging
  RAISE LOG 'Email trigger fired for table: %, operation: %, record ID: %', 
    TG_TABLE_NAME, TG_OP, NEW.id;
  
  -- For now, just log the event - the complex email logic will be handled in application code
  -- This prevents the duplicate email issues we were having with the complex trigger logic
  
  -- Log the trigger event to email_processing_log for monitoring
  INSERT INTO public.email_processing_log (
    status,
    processed_count,
    failed_count,
    request_id,
    details
  ) VALUES (
    'trigger_fired',
    0,
    0,
    gen_random_uuid(),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', NEW.id,
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$function$;