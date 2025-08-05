-- Create a new RPC function that processes email rules manually from the application
-- This replaces the disabled database triggers with application-level control

CREATE OR REPLACE FUNCTION public.process_email_rules_manual(
  source_table_param text,
  record_id_param uuid,
  school_id_param uuid,
  operation_type_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  rule_record RECORD;
  recipient_email_result RECORD;
  queue_item_id UUID;
  processed_rules integer := 0;
  failed_rules integer := 0;
  results jsonb := '{"success": true, "processed": 0, "failed": 0, "errors": []}'::jsonb;
  error_msg text;
BEGIN
  -- Validate input parameters
  IF source_table_param NOT IN ('tasks', 'subtasks', 'incidents') THEN
    RAISE EXCEPTION 'Invalid source table: %', source_table_param;
  END IF;

  -- Log the processing attempt
  RAISE LOG 'Manual email rule processing: table=%, operation=%, record_id=%', 
    source_table_param, operation_type_param, record_id_param;

  -- Find all active email rules for this operation and school
  FOR rule_record IN 
    SELECT er.id, er.template_id, er.rule_type
    FROM public.email_rules er
    WHERE er.school_id = school_id_param
      AND er.is_active = true
      AND er.rule_type = operation_type_param
      AND er.template_id IS NOT NULL
  LOOP
    BEGIN
      -- Get the record data to determine recipient
      recipient_email_result := NULL;
      
      IF source_table_param IN ('tasks', 'subtasks') THEN
        -- For tasks/subtasks, send to assigned_to user
        SELECT email, 'profile' as source INTO recipient_email_result
        FROM public.profiles 
        WHERE id = (
          SELECT assigned_to 
          FROM public.tasks 
          WHERE id = record_id_param AND source_table_param = 'tasks'
          UNION ALL
          SELECT assigned_to 
          FROM public.subtasks 
          WHERE id = record_id_param AND source_table_param = 'subtasks'
        );
        
      ELSIF source_table_param = 'incidents' THEN
        -- For incidents, send to assigned_to_admin user
        SELECT email, 'profile' as source INTO recipient_email_result
        FROM public.profiles 
        WHERE id = (
          SELECT assigned_to_admin 
          FROM public.incidents 
          WHERE id = record_id_param
        );
      END IF;

      -- Queue the email if we have a recipient
      IF recipient_email_result.email IS NOT NULL AND recipient_email_result.email != '' THEN
        SELECT public.queue_email(
          rule_record.template_id,
          recipient_email_result.email,
          source_table_param,
          record_id_param,
          school_id_param,
          rule_record.id
        ) INTO queue_item_id;
        
        processed_rules := processed_rules + 1;
        
        RAISE LOG 'Email queued successfully: queue_id=%, rule_id=%, recipient=%', 
          queue_item_id, rule_record.id, recipient_email_result.email;
          
      ELSE
        failed_rules := failed_rules + 1;
        error_msg := 'No recipient email found for rule ' || rule_record.id;
        RAISE LOG '%', error_msg;
        
        -- Add to errors array
        results := jsonb_set(
          results,
          '{errors}',
          (results->'errors') || jsonb_build_array(error_msg)
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      failed_rules := failed_rules + 1;
      error_msg := 'Failed to process rule ' || rule_record.id || ': ' || SQLERRM;
      RAISE LOG '%', error_msg;
      
      -- Add to errors array
      results := jsonb_set(
        results,
        '{errors}',
        (results->'errors') || jsonb_build_array(error_msg)
      );
    END;
  END LOOP;

  -- Update results
  results := jsonb_set(results, '{processed}', to_jsonb(processed_rules));
  results := jsonb_set(results, '{failed}', to_jsonb(failed_rules));
  results := jsonb_set(results, '{success}', to_jsonb(failed_rules = 0));

  -- Log processing completion
  INSERT INTO public.email_processing_log (
    status,
    processed_count,
    failed_count,
    request_id
  ) VALUES (
    CASE WHEN failed_rules = 0 THEN 'manual_success' ELSE 'manual_partial' END,
    processed_rules,
    failed_rules,
    gen_random_uuid()
  );

  RETURN results;
END;
$function$;