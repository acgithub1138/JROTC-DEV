-- Update queue_email function to accept and store rule_id
CREATE OR REPLACE FUNCTION public.queue_email(
  template_id_param uuid, 
  recipient_email_param text, 
  source_table_param text, 
  record_id_param uuid, 
  school_id_param uuid,
  rule_id_param uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  template_record RECORD;
  processed_subject TEXT;
  processed_body TEXT;
  record_data JSONB;
  flattened_data JSONB;
  created_by_profile RECORD;
  assigned_to_profile RECORD;
  assigned_by_profile RECORD;
  last_comment_text TEXT;
  queue_id UUID;
BEGIN
  -- Get the template
  SELECT * INTO template_record 
  FROM public.email_templates 
  WHERE id = template_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;

  -- Get the record data based on source table
  IF source_table_param = 'incidents' THEN
    SELECT to_jsonb(incidents.*) INTO record_data
    FROM public.incidents 
    WHERE id = record_id_param;
  ELSIF source_table_param = 'tasks' THEN
    SELECT to_jsonb(tasks.*) INTO record_data
    FROM public.tasks 
    WHERE id = record_id_param;
  ELSIF source_table_param = 'subtasks' THEN
    SELECT to_jsonb(subtasks.*) INTO record_data
    FROM public.subtasks 
    WHERE id = record_id_param;
  ELSE
    RAISE EXCEPTION 'Unsupported source table: %', source_table_param;
  END IF;

  IF record_data IS NULL THEN
    RAISE EXCEPTION 'Record not found in table %', source_table_param;
  END IF;

  -- Initialize flattened_data with the base record
  flattened_data := record_data;

  -- Add table-specific flattened data
  IF source_table_param = 'incidents' THEN
    -- Get created_by profile information
    IF (record_data->>'created_by') IS NOT NULL AND (record_data->>'created_by')::UUID IS NOT NULL THEN
      SELECT first_name, last_name, email INTO created_by_profile
      FROM public.profiles 
      WHERE id = (record_data->>'created_by')::UUID;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'created_by_name', COALESCE(created_by_profile.first_name || ' ' || created_by_profile.last_name, 'Unknown'),
          'created_by_first_name', COALESCE(created_by_profile.first_name, ''),
          'created_by_last_name', COALESCE(created_by_profile.last_name, ''),
          'created_by_email', COALESCE(created_by_profile.email, ''),
          'created_by', jsonb_build_object(
            'first_name', COALESCE(created_by_profile.first_name, ''),
            'last_name', COALESCE(created_by_profile.last_name, ''),
            'email', COALESCE(created_by_profile.email, ''),
            'name', COALESCE(created_by_profile.first_name || ' ' || created_by_profile.last_name, 'Unknown')
          )
        );
      ELSE
        -- Add empty values if profile not found
        flattened_data := flattened_data || jsonb_build_object(
          'created_by_name', '',
          'created_by_first_name', '',
          'created_by_last_name', '',
          'created_by_email', '',
          'created_by', jsonb_build_object(
            'first_name', '',
            'last_name', '',
            'email', '',
            'name', ''
          )
        );
      END IF;
    ELSE
      -- Add empty values if created_by is null
      flattened_data := flattened_data || jsonb_build_object(
        'created_by_name', '',
        'created_by_first_name', '',
        'created_by_last_name', '',
        'created_by_email', '',
        'created_by', jsonb_build_object(
          'first_name', '',
          'last_name', '',
          'email', '',
          'name', ''
        )
      );
    END IF;

    -- Get assigned_to_admin profile information
    IF (record_data->>'assigned_to_admin') IS NOT NULL AND (record_data->>'assigned_to_admin')::UUID IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_to_profile
      FROM public.profiles 
      WHERE id = (record_data->>'assigned_to_admin')::UUID;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_admin_name', COALESCE(assigned_to_profile.first_name || ' ' || assigned_to_profile.last_name, 'Unknown'),
          'assigned_to_admin_first_name', COALESCE(assigned_to_profile.first_name, ''),
          'assigned_to_admin_last_name', COALESCE(assigned_to_profile.last_name, ''),
          'assigned_to_admin_email', COALESCE(assigned_to_profile.email, ''),
          'assigned_to_admin', jsonb_build_object(
            'first_name', COALESCE(assigned_to_profile.first_name, ''),
            'last_name', COALESCE(assigned_to_profile.last_name, ''),
            'email', COALESCE(assigned_to_profile.email, ''),
            'name', COALESCE(assigned_to_profile.first_name || ' ' || assigned_to_profile.last_name, 'Unknown')
          )
        );
      ELSE
        -- Add empty values if profile not found
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_admin_name', '',
          'assigned_to_admin_first_name', '',
          'assigned_to_admin_last_name', '',
          'assigned_to_admin_email', '',
          'assigned_to_admin', jsonb_build_object(
            'first_name', '',
            'last_name', '',
            'email', '',
            'name', ''
          )
        );
      END IF;
    ELSE
      -- Add empty values if assigned_to_admin is null
      flattened_data := flattened_data || jsonb_build_object(
        'assigned_to_admin_name', '',
        'assigned_to_admin_first_name', '',
        'assigned_to_admin_last_name', '',
        'assigned_to_admin_email', '',
        'assigned_to_admin', jsonb_build_object(
          'first_name', '',
          'last_name', '',
          'email', '',
          'name', ''
        )
      );
    END IF;

    -- Get last comment for incidents
    SELECT comment_text INTO last_comment_text
    FROM public.incident_comments 
    WHERE incident_id = record_id_param 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    flattened_data := flattened_data || jsonb_build_object(
      'last_comment', COALESCE(last_comment_text, 'No comments yet')
    );

  ELSIF source_table_param = 'tasks' OR source_table_param = 'subtasks' THEN
    -- Get assigned_to profile information for tasks and subtasks
    IF (record_data->>'assigned_to') IS NOT NULL AND (record_data->>'assigned_to')::UUID IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_to_profile
      FROM public.profiles 
      WHERE id = (record_data->>'assigned_to')::UUID;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_name', COALESCE(assigned_to_profile.first_name || ' ' || assigned_to_profile.last_name, 'Unknown'),
          'assigned_to_first_name', COALESCE(assigned_to_profile.first_name, ''),
          'assigned_to_last_name', COALESCE(assigned_to_profile.last_name, ''),
          'assigned_to_email', COALESCE(assigned_to_profile.email, ''),
          'assigned_to', jsonb_build_object(
            'first_name', COALESCE(assigned_to_profile.first_name, ''),
            'last_name', COALESCE(assigned_to_profile.last_name, ''),
            'email', COALESCE(assigned_to_profile.email, ''),
            'name', COALESCE(assigned_to_profile.first_name || ' ' || assigned_to_profile.last_name, 'Unknown')
          )
        );
      ELSE
        -- Add empty values if profile not found
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_name', '',
          'assigned_to_first_name', '',
          'assigned_to_last_name', '',
          'assigned_to_email', '',
          'assigned_to', jsonb_build_object(
            'first_name', '',
            'last_name', '',
            'email', '',
            'name', ''
          )
        );
      END IF;
    ELSE
      -- Add empty values if assigned_to is null
      flattened_data := flattened_data || jsonb_build_object(
        'assigned_to_name', '',
        'assigned_to_first_name', '',
        'assigned_to_last_name', '',
        'assigned_to_email', '',
        'assigned_to', jsonb_build_object(
          'first_name', '',
          'last_name', '',
          'email', '',
          'name', ''
        )
      );
    END IF;

    -- Get assigned_by profile information for tasks and subtasks
    IF (record_data->>'assigned_by') IS NOT NULL AND (record_data->>'assigned_by')::UUID IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_by_profile
      FROM public.profiles 
      WHERE id = (record_data->>'assigned_by')::UUID;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_by_name', COALESCE(assigned_by_profile.first_name || ' ' || assigned_by_profile.last_name, 'Unknown'),
          'assigned_by_first_name', COALESCE(assigned_by_profile.first_name, ''),
          'assigned_by_last_name', COALESCE(assigned_by_profile.last_name, ''),
          'assigned_by_email', COALESCE(assigned_by_profile.email, ''),
          'assigned_by', jsonb_build_object(
            'first_name', COALESCE(assigned_by_profile.first_name, ''),
            'last_name', COALESCE(assigned_by_profile.last_name, ''),
            'email', COALESCE(assigned_by_profile.email, ''),
            'name', COALESCE(assigned_by_profile.first_name || ' ' || assigned_by_profile.last_name, 'Unknown')
          )
        );
      ELSE
        -- Add empty values if profile not found
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_by_name', '',
          'assigned_by_first_name', '',
          'assigned_by_last_name', '',
          'assigned_by_email', '',
          'assigned_by', jsonb_build_object(
            'first_name', '',
            'last_name', '',
            'email', '',
            'name', ''
          )
        );
      END IF;
    ELSE
      -- Add empty values if assigned_by is null
      flattened_data := flattened_data || jsonb_build_object(
        'assigned_by_name', '',
        'assigned_by_first_name', '',
        'assigned_by_last_name', '',
        'assigned_by_email', '',
        'assigned_by', jsonb_build_object(
          'first_name', '',
          'last_name', '',
          'email', '',
          'name', ''
        )
      );
    END IF;

    -- Get last comment for tasks or subtasks
    IF source_table_param = 'tasks' THEN
      SELECT comment_text INTO last_comment_text
      FROM public.task_comments 
      WHERE task_id = record_id_param 
      ORDER BY created_at DESC 
      LIMIT 1;
    ELSE -- subtasks
      SELECT comment_text INTO last_comment_text
      FROM public.subtask_comments 
      WHERE subtask_id = record_id_param 
      ORDER BY created_at DESC 
      LIMIT 1;
    END IF;
    
    flattened_data := flattened_data || jsonb_build_object(
      'last_comment', COALESCE(last_comment_text, 'No comments yet')
    );
  END IF;

  -- Process template variables
  processed_subject := public.process_email_template(template_record.subject, flattened_data);
  processed_body := public.process_email_template(template_record.body, flattened_data);

  -- Insert into email queue with rule_id
  INSERT INTO public.email_queue (
    template_id,
    recipient_email,
    subject,
    body,
    school_id,
    source_table,
    record_id,
    rule_id,
    scheduled_at
  ) VALUES (
    template_record.id,
    recipient_email_param,
    processed_subject,
    processed_body,
    school_id_param,
    source_table_param,
    record_id_param,
    rule_id_param,
    NOW()
  ) RETURNING id INTO queue_id;

  RETURN queue_id;
END;
$function$;

-- Update process_email_rules function to pass rule_id to queue_email
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
        -- Queue the email using the updated queue_email function with rule_id
        SELECT public.queue_email(
          email_rule.template_id,
          recipient_email,
          TG_TABLE_NAME,
          NEW.id,
          COALESCE(NEW.school_id, OLD.school_id),
          email_rule.id  -- Pass the rule_id
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