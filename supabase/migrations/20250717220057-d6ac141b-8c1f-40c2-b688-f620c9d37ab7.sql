-- Fix the email rules query to use the correct source_table reference from email_templates

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
  condition_met BOOLEAN := true;
  condition_group JSONB;
  condition_item JSONB;
  field_value TEXT;
  expected_value TEXT;
  operator_type TEXT;
  logic_operator TEXT;
  group_result BOOLEAN;
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
  -- For incident rules, don't filter by school since only admins can create incident rules
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
    -- Reset condition evaluation for this rule
    condition_met := true;
    
    -- Check if rule has trigger conditions to evaluate
    IF rule_record.trigger_conditions IS NOT NULL AND jsonb_array_length(rule_record.trigger_conditions) > 0 THEN
      -- Get logic operator (default to AND if not specified)
      logic_operator := COALESCE(rule_record.trigger_conditions->0->>'logic', 'AND');
      
      -- Initialize based on logic type
      IF logic_operator = 'OR' THEN
        condition_met := false; -- Need at least one condition to be true
      ELSE
        condition_met := true;  -- All conditions must be true (AND logic)
      END IF;
      
      -- Evaluate each condition group
      FOR condition_group IN SELECT * FROM jsonb_array_elements(rule_record.trigger_conditions)
      LOOP
        -- Skip if this is the logic operator object
        IF condition_group ? 'logic' THEN
          CONTINUE;
        END IF;
        
        -- Get condition details
        field_value := NULL;
        expected_value := condition_group->>'value';
        operator_type := condition_group->>'operator';
        
        -- Extract field value from record data
        CASE condition_group->>'field'
          WHEN 'status' THEN 
            field_value := record_data->>'status';
          WHEN 'priority' THEN 
            field_value := record_data->>'priority';
          WHEN 'category' THEN 
            field_value := record_data->>'category';
          WHEN 'assigned_to' THEN 
            field_value := record_data->>'assigned_to';
          WHEN 'title' THEN 
            field_value := record_data->>'title';
          ELSE
            -- Try to get any field from record data
            field_value := record_data->>condition_group->>'field';
        END CASE;
        
        -- Evaluate the condition based on operator
        group_result := false;
        CASE operator_type
          WHEN 'equals' THEN
            group_result := (field_value = expected_value);
          WHEN 'not_equals' THEN
            group_result := (field_value != expected_value OR field_value IS NULL);
          WHEN 'is_null' THEN
            group_result := (field_value IS NULL);
          WHEN 'is_not_null' THEN
            group_result := (field_value IS NOT NULL);
          WHEN 'contains' THEN
            group_result := (field_value ILIKE '%' || expected_value || '%');
          ELSE
            -- Default to true for unknown operators
            group_result := true;
        END CASE;
        
        -- Apply logic operator
        IF logic_operator = 'OR' THEN
          condition_met := condition_met OR group_result;
          -- If we found one true condition in OR logic, we can stop
          IF condition_met THEN
            EXIT;
          END IF;
        ELSE -- AND logic
          condition_met := condition_met AND group_result;
          -- If we found one false condition in AND logic, we can stop
          IF NOT condition_met THEN
            EXIT;
          END IF;
        END IF;
      END LOOP;
    END IF;
    
    -- Skip this rule if conditions are not met
    IF NOT condition_met THEN
      RAISE NOTICE 'Skipping email rule "%" - conditions not met', rule_record.name;
      CONTINUE;
    END IF;
    
    RAISE NOTICE 'Processing email rule "%" - conditions satisfied', rule_record.name;
    
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
    
    -- Log the queued event
    INSERT INTO email_logs (queue_id, event_type, event_data)
    VALUES (
      queue_item_id,
      'queued',
      jsonb_build_object(
        'rule_name', rule_record.name,
        'template_name', rule_record.template_name,
        'trigger_event', TG_OP,
        'source_table', TG_TABLE_NAME,
        'conditions_met', condition_met
      )
    );
    
  END LOOP;
  
  RETURN NEW;
END;
$function$;