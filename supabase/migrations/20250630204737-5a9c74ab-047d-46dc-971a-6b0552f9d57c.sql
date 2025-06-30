
-- Fix the email trigger function to properly handle trigger event comparison
CREATE OR REPLACE FUNCTION public.process_email_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  template_record RECORD;
  recipient_email TEXT;
  processed_subject TEXT;
  processed_body TEXT;
  record_data JSONB;
  flattened_data JSONB := '{}';
  related_data JSONB;
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
  -- Fixed the trigger_event comparison by casting both sides to text
  FOR rule_record IN 
    SELECT er.*, et.subject, et.body, et.name as template_name
    FROM email_rules er
    JOIN email_templates et ON er.template_id = et.id
    WHERE er.source_table = TG_TABLE_NAME 
      AND er.trigger_event::text = TG_OP::text
      AND er.is_active = true
      AND et.is_active = true
      AND er.school_id = NEW.school_id
  LOOP
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
    );
    
    -- Log the queued event
    INSERT INTO email_logs (queue_id, event_type, event_data)
    SELECT 
      eq.id,
      'queued',
      jsonb_build_object(
        'rule_name', rule_record.name,
        'template_name', rule_record.template_name,
        'trigger_event', TG_OP,
        'source_table', TG_TABLE_NAME
      )
    FROM email_queue eq
    WHERE eq.template_id = rule_record.template_id
      AND eq.rule_id = rule_record.id
      AND eq.recipient_email = recipient_email
      AND eq.record_id = NEW.id
    ORDER BY eq.created_at DESC
    LIMIT 1;
    
  END LOOP;
  
  RETURN NEW;
END;
$$;
