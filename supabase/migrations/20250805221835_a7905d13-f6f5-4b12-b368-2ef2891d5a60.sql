-- Update queue_email function to accept rule_id parameter
CREATE OR REPLACE FUNCTION public.queue_email(
  template_id_param uuid, 
  recipient_email_param text, 
  source_table_param text, 
  record_id_param uuid, 
  school_id_param uuid,
  rule_id_param uuid
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
  processed_subject := public.replace_template_variables(template_record.subject, flattened_data);
  processed_body := public.replace_template_variables(template_record.body, flattened_data);

  -- Insert into email queue
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