-- Update process_email_rules function to properly join data for template variables
CREATE OR REPLACE FUNCTION public.process_email_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  rule_record RECORD;
  template_record RECORD;
  recipient_email TEXT;
  processed_subject TEXT;
  processed_body TEXT;
  record_data JSONB;
  flattened_data JSONB;
  created_by_profile RECORD;
  assigned_to_profile RECORD;
  last_comment_text TEXT;
BEGIN
  -- Only process INSERT and UPDATE events
  IF TG_OP NOT IN ('INSERT', 'UPDATE') THEN
    RETURN NEW;
  END IF;

  -- Convert the record to JSONB
  record_data := to_jsonb(NEW);

  -- Initialize flattened_data with the base record
  flattened_data := record_data;

  -- Add table-specific flattened data based on table name
  IF TG_TABLE_NAME = 'incidents' THEN
    -- Get created_by profile information
    IF NEW.created_by IS NOT NULL THEN
      SELECT first_name, last_name, email INTO created_by_profile
      FROM public.profiles 
      WHERE id = NEW.created_by;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'created_by_name', COALESCE(created_by_profile.first_name || ' ' || created_by_profile.last_name, 'Unknown'),
          'created_by_first_name', COALESCE(created_by_profile.first_name, ''),
          'created_by_last_name', COALESCE(created_by_profile.last_name, ''),
          'created_by_email', COALESCE(created_by_profile.email, '')
        );
      END IF;
    END IF;

    -- Get assigned_to_admin profile information
    IF NEW.assigned_to_admin IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_to_profile
      FROM public.profiles 
      WHERE id = NEW.assigned_to_admin;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_name', COALESCE(assigned_to_profile.first_name || ' ' || assigned_to_profile.last_name, 'Unknown'),
          'assigned_to_first_name', COALESCE(assigned_to_profile.first_name, ''),
          'assigned_to_last_name', COALESCE(assigned_to_profile.last_name, ''),
          'assigned_to_email', COALESCE(assigned_to_profile.email, '')
        );
      END IF;
    END IF;

    -- Get the last comment for this incident
    SELECT comment_text INTO last_comment_text
    FROM public.incident_comments 
    WHERE incident_id = NEW.id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    flattened_data := flattened_data || jsonb_build_object(
      'last_comment', COALESCE(last_comment_text, 'No comments yet')
    );

  ELSIF TG_TABLE_NAME = 'tasks' THEN
    -- Get assigned_to profile information for tasks
    IF NEW.assigned_to IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_to_profile
      FROM public.profiles 
      WHERE id = NEW.assigned_to;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_name', COALESCE(assigned_to_profile.first_name || ' ' || assigned_to_profile.last_name, 'Unknown'),
          'assigned_to_first_name', COALESCE(assigned_to_profile.first_name, ''),
          'assigned_to_last_name', COALESCE(assigned_to_profile.last_name, ''),
          'assigned_to_email', COALESCE(assigned_to_profile.email, '')
        );
      END IF;
    END IF;

    -- Get assigned_by profile information for tasks
    IF NEW.assigned_by IS NOT NULL THEN
      SELECT first_name, last_name, email INTO created_by_profile
      FROM public.profiles 
      WHERE id = NEW.assigned_by;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_by_name', COALESCE(created_by_profile.first_name || ' ' || created_by_profile.last_name, 'Unknown'),
          'assigned_by_first_name', COALESCE(created_by_profile.first_name, ''),
          'assigned_by_last_name', COALESCE(created_by_profile.last_name, ''),
          'assigned_by_email', COALESCE(created_by_profile.email, '')
        );
      END IF;
    END IF;

    -- Get the last comment for this task
    SELECT comment_text INTO last_comment_text
    FROM public.task_comments 
    WHERE task_id = NEW.id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    flattened_data := flattened_data || jsonb_build_object(
      'last_comment', COALESCE(last_comment_text, 'No comments yet')
    );
  END IF;

  -- Loop through active email rules for this table and trigger type
  FOR rule_record IN 
    SELECT * FROM public.email_rules 
    WHERE is_active = true 
      AND table_name = TG_TABLE_NAME 
      AND trigger_event::text = TG_OP::text
      AND school_id = NEW.school_id
  LOOP
    -- Get the template
    SELECT * INTO template_record 
    FROM public.email_templates 
    WHERE id = rule_record.template_id AND is_active = true;
    
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    -- Determine recipient email based on rule configuration
    CASE rule_record.recipient_type
      WHEN 'assigned_to' THEN
        recipient_email := (flattened_data ->> 'assigned_to_email');
      WHEN 'created_by' THEN
        recipient_email := (flattened_data ->> 'created_by_email');
      WHEN 'assigned_by' THEN
        recipient_email := (flattened_data ->> 'assigned_by_email');
      WHEN 'custom' THEN
        recipient_email := rule_record.custom_recipient_email;
      ELSE
        recipient_email := rule_record.custom_recipient_email;
    END CASE;

    -- Skip if no recipient email
    IF recipient_email IS NULL OR recipient_email = '' THEN
      CONTINUE;
    END IF;

    -- Process template variables
    processed_subject := public.process_email_template(template_record.subject, flattened_data);
    processed_body := public.process_email_template(template_record.body, flattened_data);

    -- Insert into email queue
    INSERT INTO public.email_queue (
      template_id,
      rule_id,
      recipient_email,
      subject,
      body,
      school_id,
      source_table,
      record_id,
      scheduled_at
    ) VALUES (
      template_record.id,
      rule_record.id,
      recipient_email,
      processed_subject,
      processed_body,
      NEW.school_id,
      TG_TABLE_NAME,
      NEW.id,
      NOW()
    );

    -- Add a system comment to indicate email was queued
    IF TG_TABLE_NAME = 'incidents' THEN
      INSERT INTO public.incident_comments (
        incident_id,
        user_id,
        comment_text,
        is_system_comment
      ) VALUES (
        NEW.id,
        COALESCE(auth.uid(), NEW.created_by),
        'Email notification queued for: ' || recipient_email,
        true
      );
    ELSIF TG_TABLE_NAME = 'tasks' THEN
      INSERT INTO public.task_comments (
        task_id,
        user_id,
        comment_text,
        is_system_comment
      ) VALUES (
        NEW.id,
        COALESCE(auth.uid(), NEW.assigned_by),
        'Email notification queued for: ' || recipient_email,
        true
      );
    END IF;

    -- Log the event
    INSERT INTO public.email_logs (
      queue_id,
      event_type,
      event_data,
      created_at
    ) SELECT 
      eq.id,
      'queued',
      jsonb_build_object(
        'rule_id', rule_record.id,
        'template_id', template_record.id,
        'recipient', recipient_email,
        'trigger_table', TG_TABLE_NAME,
        'trigger_event', TG_OP
      ),
      NOW()
    FROM public.email_queue eq 
    WHERE eq.recipient_email = recipient_email 
      AND eq.subject = processed_subject 
      AND eq.created_at >= NOW() - INTERVAL '1 minute'
    ORDER BY eq.created_at DESC 
    LIMIT 1;

  END LOOP;

  RETURN NEW;
END;
$$;