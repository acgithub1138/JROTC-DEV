-- Update handle_comp_registration_email function to work like welcome email (look for global template)
CREATE OR REPLACE FUNCTION public.handle_comp_registration_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  template_record RECORD;
  recipient_email text;
  admin_record RECORD;
  queue_item_id UUID;
BEGIN
  -- Skip if this is not a new registration
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Find the global competition registration template (like welcome email)
  SELECT * INTO template_record
  FROM public.email_templates et
  WHERE et.school_id IS NULL
    AND et.source_table = 'cp_comp_schools'
    AND et.name ILIKE '%comp%registration%confirmation%'
    AND et.is_active = true
  LIMIT 1;
  
  -- Exit if no global template found
  IF template_record.id IS NULL THEN
    RAISE LOG 'No global competition registration email template found';
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

  -- Queue the email if we have a recipient (no rule_id needed since it's global)
  IF recipient_email IS NOT NULL AND recipient_email != '' THEN
    SELECT public.queue_email(
      template_record.id,
      recipient_email,
      'cp_comp_schools',
      NEW.id,
      NEW.school_id
    ) INTO queue_item_id;
    
    RAISE LOG 'Competition registration email queued: registration_id=%, queue_id=%, recipient=%', 
      NEW.id, queue_item_id, recipient_email;
  ELSE
    RAISE LOG 'No recipient email found for competition registration: school_id=%', NEW.school_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Remove all competition registration email rules since they're no longer needed
DELETE FROM public.email_rules WHERE rule_type = 'comp_registration_confirmation';

-- Update the constraint to remove comp_registration_confirmation from valid rule types
ALTER TABLE email_rules DROP CONSTRAINT IF EXISTS email_rules_rule_type_check;

ALTER TABLE email_rules ADD CONSTRAINT email_rules_rule_type_check 
CHECK (rule_type IN (
  'task_created',
  'task_information_needed', 
  'task_completed',
  'task_canceled',
  'task_overdue_reminder',
  'task_comment_added',
  'subtask_created',
  'subtask_information_needed',
  'subtask_completed', 
  'subtask_canceled',
  'subtask_overdue_reminder',
  'subtask_comment_added'
));

-- Update the create_email_rules_for_school function to exclude comp_registration_confirmation
CREATE OR REPLACE FUNCTION public.create_email_rules_for_school(school_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert all email rule types for the school (excluding comp_registration_confirmation)
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
    (school_uuid, 'task_comment_added', null, false, 'INSERT'),
    (school_uuid, 'subtask_comment_added', null, false, 'INSERT')
  ON CONFLICT (school_id, rule_type) DO NOTHING;
END;
$function$;