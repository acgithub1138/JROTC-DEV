-- Drop the existing function
DROP FUNCTION IF EXISTS public.send_welcome_email_on_user_creation() CASCADE;

-- Create updated function with role-based template selection
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
BEGIN
  -- Skip if this is a system update or if email is null
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  -- Determine which template to use based on role
  IF NEW.role = 'parent' THEN
    template_name_pattern := '%welcome%new%parent%';
    RAISE LOG 'Looking for parent welcome template for user: user_id=%, role=%', NEW.id, NEW.role;
  ELSE
    template_name_pattern := '%welcome%new%user%';
    RAISE LOG 'Looking for general welcome template for user: user_id=%, role=%', NEW.id, NEW.role;
  END IF;

  -- Find the appropriate global welcome email template
  SELECT * INTO welcome_template_record
  FROM public.email_templates et
  WHERE et.school_id IS NULL
    AND et.source_table = 'profiles'
    AND et.name ILIKE template_name_pattern
    AND et.is_active = true
  LIMIT 1;
  
  -- If we found a welcome template, queue the email
  IF welcome_template_record.id IS NOT NULL THEN
    -- Queue the welcome email
    SELECT public.queue_email(
      welcome_template_record.id,
      NEW.email,
      'profiles',
      NEW.id,
      NEW.school_id
    ) INTO queue_id;
    
    -- Log the welcome email queuing with role information
    RAISE LOG 'Welcome email queued for new user: user_id=%, email=%, role=%, template=%, queue_id=%', 
      NEW.id, NEW.email, NEW.role, welcome_template_record.name, queue_id;
  ELSE
    -- Log if no welcome template found with role information
    RAISE LOG 'No welcome email template found for role=% (pattern: %)', NEW.role, template_name_pattern;
  END IF;

  RETURN NEW;
END;
$function$;