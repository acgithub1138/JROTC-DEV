-- Fix the process_email_rules function to remove references to non-existent fields

CREATE OR REPLACE FUNCTION public.process_email_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  rule_record RECORD;
  template_record RECORD;
  recipient_email TEXT;
  processed_subject TEXT;
  processed_body TEXT;
  record_data JSONB;
  flattened_data JSONB := '{}';
  related_data JSONB;
  queue_item_id UUID;
BEGIN
  -- Convert the NEW record to JSONB for template processing
  record_data := to_jsonb(NEW);
  
  -- Add flattened data based on table type and relations
  IF TG_TABLE_NAME = 'tasks' THEN
    -- Get assigned_to profile data
    IF NEW.assigned_to IS NOT NULL THEN
      SELECT to_jsonb(p.*) INTO related_data
      FROM profiles p WHERE p.id = NEW.assigned_to;
      
      IF related_data IS NOT NULL THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to.id', related_data->>'id',
          'assigned_to.first_name', related_data->>'first_name',
          'assigned_to.last_name', related_data->>'last_name',
          'assigned_to.email', related_data->>'email',
          'assigned_to.full_name', CONCAT(related_data->>'first_name', ' ', related_data->>'last_name')
        );
      END IF;
    END IF;
    
    -- Get assigned_by profile data
    IF NEW.assigned_by IS NOT NULL THEN
      SELECT to_jsonb(p.*) INTO related_data
      FROM profiles p WHERE p.id = NEW.assigned_by;
      
      IF related_data IS NOT NULL THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_by.id', related_data->>'id',
          'assigned_by.first_name', related_data->>'first_name',
          'assigned_by.last_name', related_data->>'last_name',
          'assigned_by.email', related_data->>'email',
          'assigned_by.full_name', CONCAT(related_data->>'first_name', ' ', related_data->>'last_name')
        );
      END IF;
    END IF;
  END IF;
  
  -- Merge flattened data with record data
  record_data := record_data || flattened_data;
  
  -- Loop through all active email rules for this table and trigger event
  FOR rule_record IN 
    SELECT er.*, et.subject, et.body, et.name as template_name
    FROM email_rules er
    JOIN email_templates et ON er.template_id = et.id
    WHERE et.source_table = TG_TABLE_NAME 
      AND er.trigger_event = TG_OP::text
      AND er.is_active = true
      AND et.is_active = true
      AND (
        -- For incidents: no school check (only admins can create incident rules)
        TG_TABLE_NAME = 'incidents' OR 
        -- For other tables: maintain school check
        er.school_id = NEW.school_id
      )
  LOOP
    -- Determine recipient email based on rule type
    recipient_email := NULL;
    
    -- For now, we'll use a simple mapping based on rule_type
    -- This can be enhanced later with more sophisticated recipient configuration
    CASE rule_record.rule_type
      WHEN 'task_assigned' THEN
        -- Send to assigned user
        SELECT email INTO recipient_email FROM profiles WHERE id = NEW.assigned_to;
      WHEN 'task_completed' THEN
        -- Send to assigner
        SELECT email INTO recipient_email FROM profiles WHERE id = NEW.assigned_by;
      ELSE
        -- Default: send to assigned user if available
        IF NEW.assigned_to IS NOT NULL THEN
          SELECT email INTO recipient_email FROM profiles WHERE id = NEW.assigned_to;
        END IF;
    END CASE;
    
    -- Skip if no valid recipient email
    IF recipient_email IS NULL OR recipient_email = '' THEN
      RAISE NOTICE 'Skipping email rule "%" - no valid recipient email', rule_record.rule_type;
      CONTINUE;
    END IF;
    
    -- Process template variables in subject and body
    processed_subject := rule_record.subject;
    processed_body := rule_record.body;
    
    -- Replace variables in subject
    SELECT public.process_email_template(rule_record.subject, record_data) INTO processed_subject;
    
    -- Replace variables in body  
    SELECT public.process_email_template(rule_record.body, record_data) INTO processed_body;
    
    -- Insert into email queue
    INSERT INTO email_queue (
      template_id,
      rule_id,
      recipient_email,
      subject,
      body,
      record_id,
      source_table,
      school_id,
      scheduled_at
    ) VALUES (
      rule_record.template_id,
      rule_record.id,
      recipient_email,
      processed_subject,
      processed_body,
      NEW.id,
      TG_TABLE_NAME,
      NEW.school_id,
      NOW()
    ) RETURNING id INTO queue_item_id;
    
    -- Add comment for email queued with preview link
    IF TG_TABLE_NAME = 'tasks' THEN
      INSERT INTO task_comments (
        task_id,
        user_id,
        comment_text,
        is_system_comment
      ) VALUES (
        NEW.id,
        COALESCE(NEW.assigned_by, NEW.assigned_to),
        'Email queued for sending to ' || recipient_email || ' - [Preview Email](' || queue_item_id || ')',
        true
      );
    ELSIF TG_TABLE_NAME = 'subtasks' THEN
      INSERT INTO subtask_comments (
        subtask_id,
        user_id,
        comment_text,
        is_system_comment
      ) VALUES (
        NEW.id,
        COALESCE(NEW.assigned_by, NEW.assigned_to),
        'Email queued for sending to ' || recipient_email || ' - [Preview Email](' || queue_item_id || ')',
        true
      );
    END IF;
    
  END LOOP;
  
  RETURN NEW;
END;
$function$;