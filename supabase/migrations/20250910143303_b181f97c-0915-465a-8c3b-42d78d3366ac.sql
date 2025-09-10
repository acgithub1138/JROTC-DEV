-- Update the welcome email trigger to always use global templates
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_user_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  welcome_template_record RECORD;
  queue_id UUID;
BEGIN
  -- Skip if this is a system update or if email is null
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  -- Find the global welcome email template only
  SELECT * INTO welcome_template_record
  FROM public.email_templates et
  WHERE et.school_id IS NULL
    AND et.source_table = 'profiles'
    AND et.name ILIKE '%welcome%'
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
    
    -- Log the welcome email queuing
    RAISE LOG 'Welcome email queued for new user: user_id=%, email=%, queue_id=%', 
      NEW.id, NEW.email, queue_id;
  ELSE
    -- Log if no welcome template found
    RAISE LOG 'No global welcome email template found';
  END IF;

  RETURN NEW;
END;
$function$;