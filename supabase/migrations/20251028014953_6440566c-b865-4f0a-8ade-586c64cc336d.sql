-- Update send_welcome_email_on_user_creation to handle judge role and NULL school_id
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_user_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  welcome_template_record RECORD;
  queue_id UUID;
  template_name_pattern TEXT;
  school_id_to_use uuid;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  -- Determine template pattern based on role
  IF NEW.role = 'parent' THEN
    template_name_pattern := '%welcome%new%parent%';
    RAISE LOG 'Looking for parent welcome template for user: user_id=%, role=%', NEW.id, NEW.role;
  ELSIF NEW.role = 'judge' THEN
    template_name_pattern := '%welcome%new%judge%';
    RAISE LOG 'Looking for judge welcome template for user: user_id=%, role=%', NEW.id, NEW.role;
  ELSE
    template_name_pattern := '%welcome%new%user%';
    RAISE LOG 'Looking for general welcome template for user: user_id=%, role=%', NEW.id, NEW.role;
  END IF;

  -- Find the appropriate global template
  SELECT * INTO welcome_template_record
  FROM public.email_templates et
  WHERE et.school_id IS NULL
    AND et.source_table = 'profiles'
    AND et.name ILIKE template_name_pattern
    AND et.is_active = true
  LIMIT 1;

  IF welcome_template_record.id IS NOT NULL THEN
    -- Use COALESCE to handle NULL school_id (for judges)
    school_id_to_use := COALESCE(NEW.school_id, 'c0bae42f-9369-4575-b158-926246145b0a'::uuid);

    SELECT public.queue_email(
      welcome_template_record.id,
      NEW.email,
      'profiles',
      NEW.id,
      school_id_to_use
    ) INTO queue_id;

    RAISE LOG 'Welcome email queued for new user: user_id=%, email=%, role=%, template=%, queue_id=%, school_id=%',
      NEW.id, NEW.email, NEW.role, welcome_template_record.name, queue_id, school_id_to_use;
  ELSE
    RAISE LOG 'No welcome email template found for role=% (pattern: %)', NEW.role, template_name_pattern;
  END IF;

  RETURN NEW;
END;
$function$;