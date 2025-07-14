-- Remove complex functions that depend on non-existent tables
DROP FUNCTION IF EXISTS public.process_email_rules() CASCADE;
DROP FUNCTION IF EXISTS public.process_email_queue(integer) CASCADE;

-- Create a simple email queuing function
CREATE OR REPLACE FUNCTION public.queue_email(
  template_id_param UUID,
  recipient_email_param TEXT,
  source_table_param TEXT,
  record_id_param UUID,
  school_id_param UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  template_record RECORD;
  processed_subject TEXT;
  processed_body TEXT;
  record_data JSONB;
  flattened_data JSONB;
  created_by_profile RECORD;
  assigned_to_profile RECORD;
  assigned_by_profile RECORD;
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
    IF (record_data->>'created_by')::UUID IS NOT NULL THEN
      SELECT first_name, last_name, email INTO created_by_profile
      FROM public.profiles 
      WHERE id = (record_data->>'created_by')::UUID;
      
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
    IF (record_data->>'assigned_to_admin')::UUID IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_to_profile
      FROM public.profiles 
      WHERE id = (record_data->>'assigned_to_admin')::UUID;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_admin_name', COALESCE(assigned_to_profile.first_name || ' ' || assigned_to_profile.last_name, 'Unknown'),
          'assigned_to_admin_first_name', COALESCE(assigned_to_profile.first_name, ''),
          'assigned_to_admin_last_name', COALESCE(assigned_to_profile.last_name, ''),
          'assigned_to_admin_email', COALESCE(assigned_to_profile.email, '')
        );
      END IF;
    END IF;

  ELSIF source_table_param = 'tasks' THEN
    -- Get assigned_to profile information for tasks
    IF (record_data->>'assigned_to')::UUID IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_to_profile
      FROM public.profiles 
      WHERE id = (record_data->>'assigned_to')::UUID;
      
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
    IF (record_data->>'assigned_by')::UUID IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_by_profile
      FROM public.profiles 
      WHERE id = (record_data->>'assigned_by')::UUID;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_by_name', COALESCE(assigned_by_profile.first_name || ' ' || assigned_by_profile.last_name, 'Unknown'),
          'assigned_by_first_name', COALESCE(assigned_by_profile.first_name, ''),
          'assigned_by_last_name', COALESCE(assigned_by_profile.last_name, ''),
          'assigned_by_email', COALESCE(assigned_by_profile.email, '')
        );
      END IF;
    END IF;
  END IF;

  -- Process template variables
  processed_subject := public.process_email_template(template_record.subject, flattened_data);
  processed_body := public.process_email_template(template_record.body, flattened_data);

  -- Insert into email queue
  INSERT INTO public.email_queue (
    template_id,
    recipient_email,
    subject,
    body,
    school_id,
    source_table,
    record_id,
    scheduled_at
  ) VALUES (
    template_record.id,
    recipient_email_param,
    processed_subject,
    processed_body,
    school_id_param,
    source_table_param,
    record_id_param,
    NOW()
  ) RETURNING id INTO queue_id;

  RETURN queue_id;
END;
$$;