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