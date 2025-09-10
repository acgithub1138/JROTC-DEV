-- Update the handle_new_user function to include generated password in email templates
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
BEGIN
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
    CASE WHEN NEW.raw_user_meta_data ->> 'generated_password' IS NOT NULL THEN true ELSE false END
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
    -- Create flattened data for email template processing including generated password
    flattened_data := jsonb_build_object(
      'first_name', COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown'),
      'last_name', COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
      'email', NEW.email,
      'school_name', school_record.name,
      'password', COALESCE(NEW.raw_user_meta_data ->> 'generated_password', 'Please contact your administrator')
    );

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
    );
  END IF;

  RETURN NEW;
END;
$$;