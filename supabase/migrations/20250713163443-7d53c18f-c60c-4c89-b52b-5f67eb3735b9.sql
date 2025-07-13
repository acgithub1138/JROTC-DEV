-- Update process_email_rules function to handle incidents properly
CREATE OR REPLACE FUNCTION public.process_email_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  rule_record RECORD;
  recipient_email TEXT;
  processed_subject TEXT;
  processed_body TEXT;
  record_data JSONB;
  flattened_data JSONB := '{}';
  related_data JSONB;
  queue_item_id UUID;
BEGIN
  -- Only process INSERT and UPDATE events
  IF TG_OP NOT IN ('INSERT', 'UPDATE') THEN
    RETURN NEW;
  END IF;

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
  
  IF TG_TABLE_NAME = 'incidents' THEN
    -- Get created_by profile data
    IF NEW.created_by IS NOT NULL THEN
      SELECT to_jsonb(p.*) INTO related_data
      FROM profiles p WHERE p.id = NEW.created_by;
      
      IF related_data IS NOT NULL THEN
        flattened_data := flattened_data || jsonb_build_object(
          'created_by.id', related_data->>'id',
          'created_by.first_name', related_data->>'first_name',
          'created_by.last_name', related_data->>'last_name',
          'created_by.email', related_data->>'email',
          'created_by.full_name', CONCAT(related_data->>'first_name', ' ', related_data->>'last_name')
        );
      END IF;
    END IF;
    
    -- Get assigned_to_admin profile data
    IF NEW.assigned_to_admin IS NOT NULL THEN
      SELECT to_jsonb(p.*) INTO related_data
      FROM profiles p WHERE p.id = NEW.assigned_to_admin;
      
      IF related_data IS NOT NULL THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_admin.id', related_data->>'id',
          'assigned_to_admin.first_name', related_data->>'first_name',
          'assigned_to_admin.last_name', related_data->>'last_name',
          'assigned_to_admin.email', related_data->>'email',
          'assigned_to_admin.full_name', CONCAT(related_data->>'first_name', ' ', related_data->>'last_name')
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
    WHERE er.source_table = TG_TABLE_NAME 
      AND er.trigger_event = TG_OP
      AND er.is_active = true
      AND et.is_active = true
      AND (
        -- For incidents: no school check (only admins can create incident rules)
        TG_TABLE_NAME = 'incidents' OR 
        -- For other tables: maintain school check
        er.school_id = NEW.school_id
      )
  LOOP
    RAISE NOTICE 'Processing email rule "%" for % event', rule_record.name, TG_OP;
    
    -- Determine recipient email based on configuration
    recipient_email := NULL;
    
    IF rule_record.recipient_config->>'recipient_type' = 'field' THEN
      -- Extract email from record field
      recipient_email := record_data->>((rule_record.recipient_config->>'recipient_field'));
    ELSIF rule_record.recipient_config->>'recipient_type' = 'static' THEN
      -- Use static email
      recipient_email := rule_record.recipient_config->>'static_email';
    END IF;
    
    -- Skip if no valid recipient email
    IF recipient_email IS NULL OR recipient_email = '' THEN
      RAISE NOTICE 'Skipping email rule "%" - no valid recipient email', rule_record.name;
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
    
    -- Add task comment for email queued (only for tasks table)
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
    END IF;
    
    -- Add incident comment for email queued (only for incidents table)
    IF TG_TABLE_NAME = 'incidents' THEN
      INSERT INTO incident_comments (
        incident_id,
        user_id,
        comment_text,
        is_system_comment
      ) VALUES (
        NEW.id,
        COALESCE(NEW.created_by, NEW.assigned_to_admin),
        'Email queued for sending to ' || recipient_email || ' - [Preview Email](' || queue_item_id || ')',
        true
      );
    END IF;
    
    -- Log the queued event
    INSERT INTO email_logs (queue_id, event_type, event_data)
    VALUES (
      queue_item_id,
      'queued',
      jsonb_build_object(
        'rule_name', rule_record.name,
        'template_name', rule_record.template_name,
        'trigger_event', TG_OP,
        'source_table', TG_TABLE_NAME
      )
    );
    
  END LOOP;
  
  RETURN NEW;
END;
$function$;