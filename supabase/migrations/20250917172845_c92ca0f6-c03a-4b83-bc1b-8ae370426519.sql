-- Create the competition registration email data view
CREATE OR REPLACE VIEW public.competition_registration_email_data AS
WITH event_registrations AS (
  SELECT 
    er.competition_id,
    er.school_id,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'event_name', COALESCE(cet.name, 'Unknown Event'),
        'event_fee', COALESCE(ce.fee, 0),
        'event_time', CASE 
          WHEN ce.start_time IS NOT NULL THEN TO_CHAR(ce.start_time, 'MM/DD/YYYY HH12:MI AM')
          ELSE 'TBD'
        END,
        'event_location', COALESCE(ce.location, 'TBD')
      ) ORDER BY cet.name
    ) as events_json,
    COUNT(*) as events_count,
    STRING_AGG(
      '• ' || COALESCE(cet.name, 'Unknown Event') || 
      CASE WHEN ce.fee > 0 THEN ' ($' || ce.fee::text || ')' ELSE '' END,
      E'\n' ORDER BY cet.name
    ) as events_text,
    SUM(COALESCE(ce.fee, 0)) as total_event_fees
  FROM public.cp_event_registrations er
  LEFT JOIN public.cp_comp_events ce ON er.event_id = ce.id
  LEFT JOIN public.competition_event_types cet ON ce.event = cet.id
  WHERE er.status = 'registered'
  GROUP BY er.competition_id, er.school_id
)
SELECT 
  cs.id as registration_id,
  cs.school_id,
  cs.competition_id,
  -- Competition details
  comp.name as competition_name,
  TO_CHAR(comp.start_date, 'MM/DD/YYYY') as competition_start_date,
  TO_CHAR(comp.end_date, 'MM/DD/YYYY') as competition_end_date,
  comp.location as competition_location,
  comp.address as competition_address,
  comp.city as competition_city,
  comp.state as competition_state,
  comp.zip as competition_zip,
  comp.description as competition_description,
  COALESCE(comp.fee, 0) as competition_base_fee,
  comp.hosting_school,
  TO_CHAR(comp.registration_deadline, 'MM/DD/YYYY HH12:MI AM') as registration_deadline,
  -- School details
  COALESCE(cs.school_name, s.name) as school_name,
  cs.school_initials,
  cs.status as registration_status,
  cs.paid as paid_status,
  TO_CHAR(cs.created_at, 'MM/DD/YYYY HH12:MI AM') as registration_date,
  cs.registration_source,
  cs.notes as registration_notes,
  -- Cost calculations
  COALESCE(comp.fee, 0) as base_fee,
  COALESCE(er.total_event_fees, 0) as total_event_fees,
  COALESCE(comp.fee, 0) + COALESCE(er.total_event_fees, 0) as total_cost,
  cs.total_fee as school_calculated_total,
  -- Event details
  COALESCE(er.events_json, '[]'::json) as registered_events_json,
  COALESCE(er.events_count, 0) as registered_events_count,
  COALESCE(er.events_text, 'No events registered') as registered_events_text,
  -- Formatted cost strings
  '$' || COALESCE(comp.fee, 0)::text as base_fee_formatted,
  '$' || COALESCE(er.total_event_fees, 0)::text as event_fees_formatted,
  '$' || (COALESCE(comp.fee, 0) + COALESCE(er.total_event_fees, 0))::text as total_cost_formatted
FROM public.cp_comp_schools cs
LEFT JOIN public.cp_competitions comp ON cs.competition_id = comp.id
LEFT JOIN public.schools s ON cs.school_id = s.id
LEFT JOIN event_registrations er ON cs.competition_id = er.competition_id AND cs.school_id = er.school_id;

-- Update the create_email_rules_for_school function to include competition registration rule
CREATE OR REPLACE FUNCTION public.create_email_rules_for_school(school_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert all email rule types for the school (including new competition rule)
  INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
  VALUES 
    (school_uuid, 'task_created', null, false, 'INSERT'),
    (school_uuid, 'task_information_needed', null, false, 'UPDATE'),
    (school_uuid, 'task_completed', null, false, 'UPDATE'),
    (school_uuid, 'task_canceled', null, false, 'UPDATE'),
    (school_uuid, 'task_overdue_reminder', null, false, 'UPDATE'),
    (school_uuid, 'subtask_created', null, false, 'INSERT'),
    (school_uuid, 'subtask_information_needed', null, false, 'UPDATE'),
    (school_uuid, 'subtask_completed', null, false, 'UPDATE'),
    (school_uuid, 'subtask_canceled', null, false, 'UPDATE'),
    (school_uuid, 'subtask_overdue_reminder', null, false, 'UPDATE'),
    (school_uuid, 'comp_registration_confirmation', null, false, 'INSERT'),
    (school_uuid, 'task_comment_added', null, false, 'INSERT'),
    (school_uuid, 'subtask_comment_added', null, false, 'INSERT')
  ON CONFLICT (school_id, rule_type) DO NOTHING;
END;
$function$

-- Create function to handle competition registration email
CREATE OR REPLACE FUNCTION public.handle_comp_registration_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  rule_record RECORD;
  recipient_email text;
  admin_record RECORD;
  queue_item_id UUID;
BEGIN
  -- Skip if this is not a new registration
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Find active competition registration email rule
  SELECT * INTO rule_record
  FROM public.email_rules er
  WHERE er.school_id = NEW.school_id
    AND er.is_active = true
    AND er.rule_type = 'comp_registration_confirmation'
    AND er.template_id IS NOT NULL;
  
  -- Exit if no active rule found
  IF rule_record.id IS NULL THEN
    RAISE LOG 'No active competition registration email rule found for school: %', NEW.school_id;
    RETURN NEW;
  END IF;

  -- Determine recipient email
  -- First try to get school's primary contact email
  SELECT email INTO recipient_email
  FROM public.schools 
  WHERE id = NEW.school_id
    AND email IS NOT NULL 
    AND email != '';
  
  -- If no school email, find an admin from that school
  IF recipient_email IS NULL OR recipient_email = '' THEN
    SELECT p.email INTO recipient_email
    FROM public.profiles p
    JOIN public.user_roles ur ON p.role_id = ur.id
    WHERE p.school_id = NEW.school_id
      AND ur.role_name = 'admin'
      AND p.active = true
      AND p.email IS NOT NULL
      AND p.email != ''
    LIMIT 1;
  END IF;

  -- If still no email found, try instructor role
  IF recipient_email IS NULL OR recipient_email = '' THEN
    SELECT p.email INTO recipient_email
    FROM public.profiles p
    JOIN public.user_roles ur ON p.role_id = ur.id
    WHERE p.school_id = NEW.school_id
      AND ur.role_name = 'instructor'
      AND p.active = true
      AND p.email IS NOT NULL
      AND p.email != ''
    LIMIT 1;
  END IF;

  -- Queue the email if we have a recipient
  IF recipient_email IS NOT NULL AND recipient_email != '' THEN
    SELECT public.queue_email(
      rule_record.template_id,
      recipient_email,
      'cp_comp_schools',
      NEW.id,
      NEW.school_id,
      rule_record.id
    ) INTO queue_item_id;
    
    RAISE LOG 'Competition registration email queued: registration_id=%, queue_id=%, recipient=%', 
      NEW.id, queue_item_id, recipient_email;
  ELSE
    RAISE LOG 'No recipient email found for competition registration: school_id=%', NEW.school_id;
  END IF;

  RETURN NEW;
END;
$function$

-- Create trigger for competition registration emails
DROP TRIGGER IF EXISTS trigger_comp_registration_email ON public.cp_comp_schools;
CREATE TRIGGER trigger_comp_registration_email
  AFTER INSERT ON public.cp_comp_schools
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comp_registration_email();

-- Update queue_email function to handle cp_comp_schools source table
CREATE OR REPLACE FUNCTION public.queue_email(template_id_param uuid, recipient_email_param text, source_table_param text, record_id_param uuid, school_id_param uuid, rule_id_param uuid DEFAULT NULL::uuid)
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
  competition_data RECORD;
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

  -- Handle different source tables
  IF source_table_param = 'profiles' THEN
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
    ELSE
      record_data := jsonb_build_object();
    END IF;
    
  ELSIF source_table_param = 'cp_comp_schools' THEN
    -- For competition registrations, get data from the view
    SELECT * INTO competition_data
    FROM public.competition_registration_email_data 
    WHERE registration_id = record_id_param;
    
    IF FOUND THEN
      record_data := row_to_json(competition_data)::jsonb;
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
$function$

-- Add the new rule type to existing schools that don't have it
INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
SELECT s.id, 'comp_registration_confirmation', null, false, 'INSERT'
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_rules er 
  WHERE er.school_id = s.id AND er.rule_type = 'comp_registration_confirmation'
);

-- Add comment-related rules to existing schools that don't have them
INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
SELECT s.id, 'task_comment_added', null, false, 'INSERT'
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_rules er 
  WHERE er.school_id = s.id AND er.rule_type = 'task_comment_added'
);

INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
SELECT s.id, 'subtask_comment_added', null, false, 'INSERT'
FROM public.schools s
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_rules er 
  WHERE er.school_id = s.id AND er.rule_type = 'subtask_comment_added'
);