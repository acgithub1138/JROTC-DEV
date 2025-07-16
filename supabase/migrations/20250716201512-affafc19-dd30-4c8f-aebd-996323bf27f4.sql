-- Add recipient_field column to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN recipient_field text;

-- Add default recipient fields for existing templates based on their source table
-- For tasks and subtasks, default to "assigned_to" 
UPDATE public.email_templates 
SET recipient_field = 'assigned_to'
WHERE source_table IN ('tasks', 'subtasks');

-- For incidents, default to "assigned_to_admin"
UPDATE public.email_templates 
SET recipient_field = 'assigned_to_admin'
WHERE source_table = 'incidents';

-- Update the process_email_rules function to use the template's recipient_field
CREATE OR REPLACE FUNCTION public.process_email_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  email_rule RECORD;
  recipient_email TEXT;
  email_source TEXT;
  rule_type_to_check TEXT;
  old_status TEXT;
  new_status TEXT;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  processing_time_ms INTEGER;
  queue_id UUID;
  recipient_user_id UUID;
BEGIN
  start_time := clock_timestamp();
  
  -- Only process INSERT and UPDATE events
  IF TG_OP NOT IN ('INSERT', 'UPDATE') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- For tasks and subtasks table, determine rule type based on operation and status changes
  IF TG_TABLE_NAME = 'tasks' OR TG_TABLE_NAME = 'subtasks' THEN
    IF TG_OP = 'INSERT' THEN
      rule_type_to_check := 'task_created';
    ELSIF TG_OP = 'UPDATE' THEN
      old_status := OLD.status;
      new_status := NEW.status;
      
      -- Check if status actually changed
      IF old_status IS DISTINCT FROM new_status THEN
        -- Map status to rule type
        CASE new_status
          WHEN 'completed' THEN rule_type_to_check := 'task_completed';
          WHEN 'canceled', 'cancelled' THEN rule_type_to_check := 'task_canceled';
          WHEN 'information_needed', 'need_information' THEN rule_type_to_check := 'task_information_needed';
          ELSE rule_type_to_check := NULL;
        END CASE;
      ELSE
        -- Status didn't change, no email rules to process
        RETURN NEW;
      END IF;
    END IF;
  ELSE
    -- For other tables, default to created rule
    rule_type_to_check := TG_TABLE_NAME || '_created';
  END IF;

  -- Skip if no rule type determined
  IF rule_type_to_check IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Process each active email rule with recipient_field configuration
  FOR email_rule IN 
    SELECT er.id, er.rule_type, er.template_id, et.subject, et.body, et.source_table, et.recipient_field
    FROM public.email_rules er
    JOIN public.email_templates et ON er.template_id = et.id
    WHERE er.school_id = COALESCE(NEW.school_id, OLD.school_id)
      AND er.rule_type = rule_type_to_check
      AND er.trigger_event = TG_OP
      AND er.is_active = true
      AND et.is_active = true
      AND (et.source_table = TG_TABLE_NAME OR (et.source_table = 'tasks' AND TG_TABLE_NAME = 'subtasks'))
  LOOP
    -- Determine recipient based on template's recipient_field configuration
    recipient_user_id := NULL;
    recipient_email := NULL;
    email_source := NULL;
    
    -- Extract the user ID from the record based on recipient_field
    IF email_rule.recipient_field = 'assigned_to' THEN
      recipient_user_id := NEW.assigned_to;
    ELSIF email_rule.recipient_field = 'assigned_by' THEN
      recipient_user_id := NEW.assigned_by;
    ELSIF email_rule.recipient_field = 'created_by' THEN
      recipient_user_id := NEW.created_by;
    ELSIF email_rule.recipient_field = 'assigned_to_admin' THEN
      recipient_user_id := NEW.assigned_to_admin;
    END IF;

    -- Resolve email address if we have a user ID
    IF recipient_user_id IS NOT NULL THEN
      SELECT email_res.email, email_res.source INTO recipient_email, email_source
      FROM public.resolve_user_email_with_job_priority(recipient_user_id, NEW.school_id) AS email_res(email, source);
    END IF;

    -- Only proceed if we have a recipient email
    IF recipient_email IS NOT NULL AND recipient_email != '' THEN
      BEGIN
        -- Queue the email using the existing queue_email function
        SELECT public.queue_email(
          email_rule.template_id,
          recipient_email,
          TG_TABLE_NAME,
          NEW.id,
          COALESCE(NEW.school_id, OLD.school_id)
        ) INTO queue_id;
        
        -- Calculate processing time
        end_time := clock_timestamp();
        processing_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        -- Log successful rule usage with email source information
        PERFORM public.log_email_rule_usage(
          email_rule.id,
          TG_TABLE_NAME,
          TG_OP,
          NEW.id,
          recipient_email,
          true,
          'Email resolved from: ' || COALESCE(email_source, 'unknown') || ' (field: ' || COALESCE(email_rule.recipient_field, 'default') || ')',
          processing_time_ms,
          COALESCE(NEW.school_id, OLD.school_id)
        );
        
        -- Add a system comment indicating email was queued
        IF TG_TABLE_NAME = 'tasks' THEN
          INSERT INTO public.task_comments (
            task_id,
            user_id,
            comment_text,
            is_system_comment
          ) VALUES (
            NEW.id,
            COALESCE(auth.uid(), NEW.assigned_by),
            'Email notification sent: ' || email_rule.rule_type || ' to ' || recipient_email || ' (source: ' || COALESCE(email_source, 'unknown') || ', field: ' || email_rule.recipient_field || ')',
            true
          );
        ELSIF TG_TABLE_NAME = 'subtasks' THEN
          INSERT INTO public.subtask_comments (
            subtask_id,
            user_id,
            comment_text,
            is_system_comment
          ) VALUES (
            NEW.id,
            COALESCE(auth.uid(), NEW.assigned_by),
            'Email notification sent: ' || email_rule.rule_type || ' to ' || recipient_email || ' (source: ' || COALESCE(email_source, 'unknown') || ', field: ' || email_rule.recipient_field || ')',
            true
          );
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        -- Calculate processing time for failed operation
        end_time := clock_timestamp();
        processing_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        -- Log failed rule usage
        PERFORM public.log_email_rule_usage(
          email_rule.id,
          TG_TABLE_NAME,
          TG_OP,
          NEW.id,
          COALESCE(recipient_email, 'unknown'),
          false,
          'Email processing failed: ' || SQLERRM,
          processing_time_ms,
          COALESCE(NEW.school_id, OLD.school_id)
        );
        
        -- Log error but don't fail the main operation
        RAISE WARNING 'Failed to queue email for rule %: %', email_rule.id, SQLERRM;
      END;
    ELSE
      -- Log when no email could be resolved
      PERFORM public.log_email_rule_usage(
        email_rule.id,
        TG_TABLE_NAME,
        TG_OP,
        NEW.id,
        'no-email-found',
        false,
        'No email address could be resolved for user in field: ' || COALESCE(email_rule.recipient_field, 'default'),
        NULL,
        COALESCE(NEW.school_id, OLD.school_id)
      );
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$function$;