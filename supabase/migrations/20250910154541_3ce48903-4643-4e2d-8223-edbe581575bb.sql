-- Apply the updated handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public' 
AS $$
DECLARE
  role_uuid uuid;
  school_record RECORD;
  template_record RECORD;
  queue_item_id UUID;
  flattened_data JSONB;
  generated_password_val text;
BEGIN
  -- Log the start of function
  RAISE LOG 'handle_new_user called for user: %, email: %', NEW.id, NEW.email;
  RAISE LOG 'raw_user_meta_data: %', NEW.raw_user_meta_data;

  -- Extract password from metadata with better logging
  generated_password_val := NEW.raw_user_meta_data ->> 'generated_password';
  RAISE LOG 'Extracted generated_password: %', generated_password_val;

  -- Look up the role_id if role is provided in metadata
  IF NEW.raw_user_meta_data ->> 'role_id' IS NOT NULL THEN
    -- Use the role_id directly if provided
    role_uuid := (NEW.raw_user_meta_data ->> 'role_id')::uuid;
  ELSIF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    -- Look up role_id based on role name
    SELECT id INTO role_uuid 
    FROM public.user_roles 
    WHERE role_name = (NEW.raw_user_meta_data ->> 'role');
  ELSE
    -- Default to cadet role
    SELECT id INTO role_uuid 
    FROM public.user_roles 
    WHERE role_name = 'cadet';
  END IF;

  -- Insert the profile with text-based role (no enum casting)
  INSERT INTO public.profiles (id, school_id, first_name, last_name, email, role, role_id, password_change_required)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'school_id')::uuid,
      (SELECT id FROM public.schools LIMIT 1)
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'cadet'),
    role_uuid,
    -- Set password change required if a generated password was used
    CASE WHEN generated_password_val IS NOT NULL THEN true ELSE false END
  );

  -- Get school information for the welcome email
  SELECT * INTO school_record
  FROM public.schools 
  WHERE id = COALESCE(
    (NEW.raw_user_meta_data ->> 'school_id')::uuid,
    (SELECT id FROM public.schools LIMIT 1)
  );

  -- Get the welcome email template
  SELECT * INTO template_record
  FROM public.email_templates 
  WHERE name = 'Welcome New User' AND is_active = true AND is_global = true
  LIMIT 1;

  -- Queue the welcome email if template exists
  IF template_record.id IS NOT NULL AND school_record.id IS NOT NULL THEN
    RAISE LOG 'Queueing welcome email with template: %', template_record.id;
    
    -- Create flattened data for email template processing including generated password
    flattened_data := jsonb_build_object(
      'first_name', COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown'),
      'last_name', COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
      'email', NEW.email,
      'school_name', school_record.name,
      'password', COALESCE(generated_password_val, 'Please contact your administrator')
    );

    RAISE LOG 'Template data for processing: %', flattened_data;

    -- Process template variables and queue email directly
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
      NEW.email,
      public.replace_template_variables(template_record.subject, flattened_data),
      public.replace_template_variables(template_record.body, flattened_data),
      school_record.id,
      'profiles',
      NEW.id,
      NOW()
    ) RETURNING id INTO queue_item_id;

    RAISE LOG 'Queued email with ID: %, processed body should contain password', queue_item_id;
  ELSE
    RAISE LOG 'No template found or missing school record. Template ID: %, School ID: %', template_record.id, school_record.id;
  END IF;

  RETURN NEW;
END;
$$;