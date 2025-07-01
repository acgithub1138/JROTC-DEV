
-- Create a function to process email rules when database events occur
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
    WHERE er.source_table = TG_TABLE_NAME 
      AND er.trigger_event = TG_OP::text
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
$$;

-- Create triggers for tables that support email rules
CREATE OR REPLACE TRIGGER tasks_email_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

-- Create triggers for other tables as needed
CREATE OR REPLACE TRIGGER cadets_email_trigger
  AFTER INSERT OR UPDATE ON public.cadets
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

CREATE OR REPLACE TRIGGER contacts_email_trigger
  AFTER INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

CREATE OR REPLACE TRIGGER expenses_email_trigger
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

-- Function to process email queue (can be called by edge function)
CREATE OR REPLACE FUNCTION public.process_email_queue(batch_size INTEGER DEFAULT 10)
RETURNS TABLE(processed_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queue_record RECORD;
  processed INTEGER := 0;
  failed INTEGER := 0;
BEGIN
  -- Get pending emails to process
  FOR queue_record IN 
    SELECT * FROM email_queue 
    WHERE status = 'pending' 
      AND scheduled_at <= NOW()
    ORDER BY created_at ASC
    LIMIT batch_size
  LOOP
    -- Mark as sent (this would normally be done after successful email sending)
    UPDATE email_queue 
    SET status = 'sent', sent_at = NOW(), updated_at = NOW()
    WHERE id = queue_record.id;
    
    -- Update task comment to reflect email sent (only for tasks)
    IF queue_record.source_table = 'tasks' THEN
      UPDATE task_comments 
      SET comment_text = 'Email sent to ' || queue_record.recipient_email || ' - [Preview Email](' || queue_record.id || ')'
      WHERE task_id = queue_record.record_id 
        AND comment_text LIKE 'Email queued for sending to ' || queue_record.recipient_email || '%'
        AND is_system_comment = true;
    END IF;
    
    -- Log the sent event
    INSERT INTO email_logs (queue_id, event_type, event_data)
    VALUES (
      queue_record.id,
      'sent',
      jsonb_build_object(
        'sent_at', NOW(),
        'recipient', queue_record.recipient_email
      )
    );
    
    processed := processed + 1;
  END LOOP;
  
  RETURN QUERY SELECT processed, failed;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.process_email_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_email_queue(INTEGER) TO authenticated;
