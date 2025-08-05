-- Restore email queuing logic in the process_email_rules trigger
CREATE OR REPLACE FUNCTION public.process_email_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  rule_record RECORD;
  recipient_email_result RECORD;
  queue_item_id UUID;
  operation_type TEXT;
BEGIN
  -- Determine the operation type based on table and trigger operation
  IF TG_TABLE_NAME = 'tasks' AND TG_OP = 'INSERT' THEN
    operation_type := 'task_created';
  ELSIF TG_TABLE_NAME = 'subtasks' AND TG_OP = 'INSERT' THEN
    operation_type := 'subtask_created';
  ELSIF TG_TABLE_NAME = 'tasks' AND TG_OP = 'UPDATE' THEN
    operation_type := 'task_updated';
  ELSIF TG_TABLE_NAME = 'subtasks' AND TG_OP = 'UPDATE' THEN
    operation_type := 'subtask_updated';
  ELSIF TG_TABLE_NAME = 'incidents' AND TG_OP = 'INSERT' THEN
    operation_type := 'incident_created';
  ELSIF TG_TABLE_NAME = 'incidents' AND TG_OP = 'UPDATE' THEN
    operation_type := 'incident_updated';
  ELSE
    -- Unknown operation, just log and return
    RAISE LOG 'Email trigger fired for unknown operation: table=%, op=%', TG_TABLE_NAME, TG_OP;
    RETURN NEW;
  END IF;

  RAISE LOG 'Email trigger processing: table=%, operation=%, record_id=%', TG_TABLE_NAME, operation_type, NEW.id;

  -- Find all active email rules for this operation and school
  FOR rule_record IN 
    SELECT er.id, er.template_id, er.rule_type
    FROM public.email_rules er
    WHERE er.school_id = NEW.school_id
      AND er.is_active = true
      AND er.rule_type = operation_type
      AND er.template_id IS NOT NULL
  LOOP
    -- Determine recipient email based on rule type and record data
    recipient_email_result := NULL;
    
    IF operation_type IN ('task_created', 'task_updated', 'subtask_created', 'subtask_updated') THEN
      -- For tasks/subtasks, send to assigned_to user
      IF NEW.assigned_to IS NOT NULL THEN
        SELECT email, 'profile' as source INTO recipient_email_result
        FROM public.resolve_user_email_with_job_priority(NEW.assigned_to, NEW.school_id);
      END IF;
    ELSIF operation_type IN ('incident_created', 'incident_updated') THEN
      -- For incidents, send to assigned_to_admin user
      IF NEW.assigned_to_admin IS NOT NULL THEN
        SELECT email, 'profile' as source INTO recipient_email_result
        FROM public.resolve_user_email_with_job_priority(NEW.assigned_to_admin, NEW.school_id);
      END IF;
    END IF;

    -- Queue the email if we have a recipient
    IF recipient_email_result.email IS NOT NULL AND recipient_email_result.email != '' THEN
      BEGIN
        SELECT public.queue_email(
          rule_record.template_id,
          recipient_email_result.email,
          TG_TABLE_NAME,
          NEW.id,
          NEW.school_id,
          rule_record.id
        ) INTO queue_item_id;
        
        RAISE LOG 'Email queued successfully: queue_id=%, rule_id=%, recipient=%', 
          queue_item_id, rule_record.id, recipient_email_result.email;
          
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to queue email for rule %: %', rule_record.id, SQLERRM;
        
        -- Log the failure in email_processing_log
        INSERT INTO public.email_processing_log (
          status,
          processed_count,
          failed_count,
          request_id
        ) VALUES (
          'trigger_error',
          0,
          1,
          gen_random_uuid()
        );
      END;
    ELSE
      RAISE LOG 'No recipient email found for rule % (operation: %)', rule_record.id, operation_type;
    END IF;
  END LOOP;

  -- Log successful trigger execution
  INSERT INTO public.email_processing_log (
    status,
    processed_count,
    failed_count,
    request_id
  ) VALUES (
    'trigger_completed',
    1,
    0,
    gen_random_uuid()
  );

  RETURN NEW;
END;
$function$;