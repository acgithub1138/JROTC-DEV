-- Update queue_email function to include temp_pswd in template processing
CREATE OR REPLACE FUNCTION public.queue_email(template_id_param uuid, recipient_email_param text, source_table_param text, record_id_param uuid, school_id_param uuid, rule_id_param uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
BEGIN
  -- Get the template
  SELECT * INTO template_record 
  FROM public.email_templates 
  WHERE id = template_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;

  -- Get school information for header
  SELECT name, logo_url INTO school_record
  FROM public.schools 
  WHERE id = school_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'School not found';
  END IF;

  -- For profiles table (welcome emails), get profile data including temp_pswd
  IF source_table_param = 'profiles' THEN
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
    ELSE
      record_data := jsonb_build_object();
    END IF;
  ELSE
    -- Handle other source tables as before
    record_data := jsonb_build_object();
  END IF;

  IF record_data IS NULL THEN
    record_data := jsonb_build_object();
  END IF;

  -- Initialize flattened_data with the base record
  flattened_data := record_data;

  -- Add school information to flattened data
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
  
  -- Add school name
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
$$;