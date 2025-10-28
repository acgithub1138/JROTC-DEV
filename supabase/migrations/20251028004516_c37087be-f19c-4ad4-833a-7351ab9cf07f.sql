-- Update queue_email to gracefully handle missing/invalid school_id (no exception)
CREATE OR REPLACE FUNCTION public.queue_email(
  template_id_param uuid,
  recipient_email_param text,
  source_table_param text,
  record_id_param uuid,
  school_id_param uuid,
  rule_id_param uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  template_record RECORD;
  school_record RECORD;
  processed_subject TEXT;
  processed_body TEXT;
  record_data JSONB;
  flattened_data JSONB;
  profile_data RECORD;
  queue_id UUID;
  email_header_html TEXT;
  comp_reg_data RECORD;
  task_data RECORD;
  subtask_data RECORD;
  last_comment_text TEXT; -- holds the latest comment text
BEGIN
  -- Get the template
  SELECT * INTO template_record 
  FROM public.email_templates 
  WHERE id = template_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;

  -- Initialize record_data
  record_data := jsonb_build_object();

  -- Handle different source tables
  IF source_table_param = 'tasks' THEN
    -- Get task data with related user information
    SELECT 
      t.*,
      assigned_user.first_name as assigned_to_first_name,
      assigned_user.last_name as assigned_to_last_name,
      (assigned_user.last_name || ', ' || assigned_user.first_name) as assigned_to_name,
      assigned_by_user.first_name as assigned_by_first_name,
      assigned_by_user.last_name as assigned_by_last_name,
      (assigned_by_user.last_name || ', ' || assigned_by_user.first_name) as assigned_by_name
    INTO task_data
    FROM public.tasks t
    LEFT JOIN public.profiles assigned_user ON t.assigned_to = assigned_user.id
    LEFT JOIN public.profiles assigned_by_user ON t.assigned_by = assigned_by_user.id
    WHERE t.id = record_id_param;
    
    -- get the latest non-system comment, fallback to any comment
    last_comment_text := NULL;
    SELECT tc.comment_text
    INTO last_comment_text
    FROM public.task_comments tc
    WHERE tc.task_id = record_id_param
      AND tc.is_system_comment = false
    ORDER BY tc.created_at DESC
    LIMIT 1;

    IF last_comment_text IS NULL THEN
      SELECT tc.comment_text
      INTO last_comment_text
      FROM public.task_comments tc
      WHERE tc.task_id = record_id_param
      ORDER BY tc.created_at DESC
      LIMIT 1;
    END IF;
    
    IF FOUND THEN
      record_data := jsonb_build_object(
        'id', task_data.id,
        'task_number', COALESCE(task_data.task_number, ''),
        'title', COALESCE(task_data.title, ''),
        'description', COALESCE(task_data.description, ''),
        'status', COALESCE(task_data.status, ''),
        'priority', COALESCE(task_data.priority, ''),
        'due_date', COALESCE(to_char(task_data.due_date, 'MM/DD/YYYY'), ''),
        'created_at', COALESCE(to_char(task_data.created_at, 'MM/DD/YYYY'), ''),
        'assigned_to_name', COALESCE(task_data.assigned_to_name, ''),
        'assigned_to_first_name', COALESCE(task_data.assigned_to_first_name, ''),
        'assigned_to_last_name', COALESCE(task_data.assigned_to_last_name, ''),
        'assigned_by_name', COALESCE(task_data.assigned_by_name, ''),
        'assigned_by_first_name', COALESCE(task_data.assigned_by_first_name, ''),
        'assigned_by_last_name', COALESCE(task_data.assigned_by_last_name, ''),
        'last_comment', COALESCE(last_comment_text, '')
      );
    END IF;
    
  ELSIF source_table_param = 'subtasks' THEN
    -- Get subtask data with related user information
    SELECT 
      st.*,
      assigned_user.first_name as assigned_to_first_name,
      assigned_user.last_name as assigned_to_last_name,
      (assigned_user.last_name || ', ' || assigned_user.first_name) as assigned_to_name,
      assigned_by_user.first_name as assigned_by_first_name,
      assigned_by_user.last_name as assigned_by_last_name,
      (assigned_by_user.last_name || ', ' || assigned_by_user.first_name) as assigned_by_name
    INTO subtask_data
    FROM public.subtasks st
    LEFT JOIN public.profiles assigned_user ON st.assigned_to = assigned_user.id
    LEFT JOIN public.profiles assigned_by_user ON st.assigned_by = assigned_by_user.id
    WHERE st.id = record_id_param;

    -- get the latest non-system comment for subtask, fallback to any comment
    last_comment_text := NULL;
    SELECT sc.comment_text
    INTO last_comment_text
    FROM public.subtask_comments sc
    WHERE sc.subtask_id = record_id_param
      AND sc.is_system_comment = false
    ORDER BY sc.created_at DESC
    LIMIT 1;

    IF last_comment_text IS NULL THEN
      SELECT sc.comment_text
      INTO last_comment_text
      FROM public.subtask_comments sc
      WHERE sc.subtask_id = record_id_param
      ORDER BY sc.created_at DESC
      LIMIT 1;
    END IF;
    
    IF FOUND THEN
      record_data := jsonb_build_object(
        'id', subtask_data.id,
        'task_number', COALESCE(subtask_data.task_number, ''),
        'title', COALESCE(subtask_data.title, ''),
        'description', COALESCE(subtask_data.description, ''),
        'status', COALESCE(subtask_data.status, ''),
        'priority', COALESCE(subtask_data.priority, ''),
        'due_date', COALESCE(to_char(subtask_data.due_date, 'MM/DD/YYYY'), ''),
        'created_at', COALESCE(to_char(subtask_data.created_at, 'MM/DD/YYYY'), ''),
        'assigned_to_name', COALESCE(subtask_data.assigned_to_name, ''),
        'assigned_to_first_name', COALESCE(subtask_data.assigned_to_first_name, ''),
        'assigned_to_last_name', COALESCE(subtask_data.assigned_to_last_name, ''),
        'assigned_by_name', COALESCE(subtask_data.assigned_by_name, ''),
        'assigned_by_first_name', COALESCE(subtask_data.assigned_by_first_name, ''),
        'assigned_by_last_name', COALESCE(subtask_data.assigned_by_last_name, ''),
        'last_comment', COALESCE(last_comment_text, '')
      );
    END IF;
    
  ELSIF source_table_param = 'profiles' THEN
    -- For profiles table (welcome emails), get profile data including temp_pswd
    SELECT * INTO profile_data
    FROM public.profiles 
    WHERE id = record_id_param;
    
    IF FOUND THEN
      record_data := jsonb_build_object(
        'id', profile_data.id,
        'first_name', COALESCE(profile_data.first_name, ''),
        'last_name', COALESCE(profile_data.last_name, ''),
        'email', COALESCE(profile_data.email, ''),
        'role', COALESCE(profile_data.role, ''),
        'password', COALESCE(profile_data.temp_pswd, 'Please contact your administrator'),
        'temp_pswd', COALESCE(profile_data.temp_pswd, '')
      );
    END IF;
    
  ELSIF source_table_param = 'cp_comp_schools' THEN
    -- For competition registration emails, get comprehensive competition data
    SELECT * INTO comp_reg_data
    FROM public.competition_registration_email_data
    WHERE registration_id = record_id_param;
    
    IF FOUND THEN
      record_data := jsonb_build_object(
        'competition_name', COALESCE(comp_reg_data.competition_name, ''),
        'competition_start_date', COALESCE(comp_reg_data.competition_start_date, ''),
        'competition_end_date', COALESCE(comp_reg_data.competition_end_date, ''),
        'competition_location', COALESCE(comp_reg_data.competition_location, ''),
        'competition_address', COALESCE(comp_reg_data.competition_address, ''),
        'competition_city', COALESCE(comp_reg_data.competition_city, ''),
        'competition_state', COALESCE(comp_reg_data.competition_state, ''),
        'competition_zip', COALESCE(comp_reg_data.competition_zip, ''),
        'hosting_school', COALESCE(comp_reg_data.hosting_school, ''),
        'registration_deadline', COALESCE(comp_reg_data.registration_deadline, ''),
        'registered_events_count', COALESCE(comp_reg_data.registered_events_count::text, '0'),
        'registered_events_text', COALESCE(comp_reg_data.registered_events_text, 'No events registered'),
        'total_fee', COALESCE(comp_reg_data.total_cost::text, '0'),
        'total_cost', COALESCE(comp_reg_data.total_cost::text, '0'),
        'base_fee', COALESCE(comp_reg_data.base_fee::text, '0'),
        'total_event_fees', COALESCE(comp_reg_data.total_event_fees::text, '0'),
        'school_name', COALESCE(comp_reg_data.school_name, ''),
        'school_initials', COALESCE(comp_reg_data.school_initials, ''),
        'registration_status', COALESCE(comp_reg_data.registration_status, ''),
        'registration_date', COALESCE(comp_reg_data.registration_date, ''),
        'paid_status', CASE WHEN comp_reg_data.paid_status THEN 'Paid' ELSE 'Unpaid' END
      );
    END IF;
  END IF;

  -- Initialize flattened_data with the base record
  flattened_data := record_data;

  -- Optionally fetch school information for header if provided
  IF school_id_param IS NOT NULL THEN
    SELECT name, logo_url INTO school_record
    FROM public.schools 
    WHERE id = school_id_param;
    -- If not found, keep school_record as NULLs and continue
  END IF;

  -- Add school information to flattened data (will be empty strings if no school)
  flattened_data := flattened_data || jsonb_build_object(
    'school_name', COALESCE(school_record.name, ''),
    'school_logo_url', COALESCE(school_record.logo_url, ''),
    'school', jsonb_build_object(
      'name', COALESCE(school_record.name, ''),
      'logo_url', COALESCE(school_record.logo_url, '')
    )
  );

  -- Process template variables
  processed_subject := public.replace_template_variables(template_record.subject, flattened_data);
  processed_body := public.replace_template_variables(template_record.body, flattened_data);

  -- Create email header HTML
  email_header_html := '<div style="background-color: #f8fafc; padding: 20px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; text-align: center;">';
  
  -- Add logo if available
  IF school_record.logo_url IS NOT NULL AND school_record.logo_url != '' THEN
    email_header_html := email_header_html || 
      '<img src="' || school_record.logo_url || '" alt="' || COALESCE(school_record.name, 'School') || ' Logo" style="height: 60px; margin-bottom: 10px; vertical-align: middle;">';
  END IF;
  
  -- Add school name (fallback to generic text if not available)
  email_header_html := email_header_html || 
    '<h1 style="margin: 0; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; font-size: 24px; font-weight: 600;">' || 
    COALESCE(school_record.name, 'School') || 
    '</h1></div>';

  -- Prepend header to processed body
  processed_body := email_header_html || processed_body;

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
