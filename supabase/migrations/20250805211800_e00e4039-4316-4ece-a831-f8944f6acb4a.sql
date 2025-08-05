-- Fix the email_processing_log column error
-- Remove the non-existent 'details' column from the INSERT statement

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
    request_id
  ) VALUES (
    'trigger_fired',
    0,
    0,
    gen_random_uuid()
  );
  
  RETURN NEW;
END;
$function$;