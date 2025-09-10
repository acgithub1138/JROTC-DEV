-- Update handle_new_user function to use temp_pswd field and simple email queue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  role_uuid uuid;
  school_record RECORD;
  template_record RECORD;
  queue_item_id UUID;
BEGIN
  -- Log the start of function
  RAISE LOG 'handle_new_user called for user: %, email: %', NEW.id, NEW.email;
  RAISE LOG 'raw_user_meta_data: %', NEW.raw_user_meta_data;

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
    -- Password change required is set in the edge functions based on temp_pswd
    false
  );

  -- Get school information for the welcome email
  SELECT * INTO school_record
  FROM public.schools 
  WHERE id = COALESCE(
    (NEW.raw_user_meta_data ->> 'school_id')::uuid,
    (SELECT id FROM public.schools LIMIT 1)
  );

  -- Find the global welcome email template
  SELECT * INTO template_record
  FROM public.email_templates 
  WHERE name = 'Welcome New User' AND is_active = true AND is_global = true
  LIMIT 1;

  -- Queue the welcome email if template exists using the existing queue_email function
  IF template_record.id IS NOT NULL AND school_record.id IS NOT NULL THEN
    RAISE LOG 'Queueing welcome email with template: %', template_record.id;
    
    -- Use the existing queue_email function which already handles template processing
    SELECT public.queue_email(
      template_record.id,
      NEW.email,
      'profiles',
      NEW.id,
      school_record.id
    ) INTO queue_item_id;

    RAISE LOG 'Queued welcome email with ID: %', queue_item_id;
  ELSE
    RAISE LOG 'No welcome template found or missing school record. Template ID: %, School ID: %', template_record.id, school_record.id;
  END IF;

  RETURN NEW;
END;
$$;