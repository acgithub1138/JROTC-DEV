-- Add new email rule types for comment notifications
DO $$
BEGIN
  -- Add task_comment_added and subtask_comment_added to existing schools
  INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
  SELECT 
    s.id as school_id,
    'task_comment_added' as rule_type,
    null as template_id,
    false as is_active,
    'INSERT' as trigger_event
  FROM public.schools s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.email_rules er 
    WHERE er.school_id = s.id AND er.rule_type = 'task_comment_added'
  );

  INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
  SELECT 
    s.id as school_id,
    'subtask_comment_added' as rule_type,
    null as template_id,
    false as is_active,
    'INSERT' as trigger_event
  FROM public.schools s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.email_rules er 
    WHERE er.school_id = s.id AND er.rule_type = 'subtask_comment_added'
  );
END $$;

-- Update the create_email_rules_for_school function to include the new rule types
CREATE OR REPLACE FUNCTION public.create_email_rules_for_school(school_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert all email rule types for the school
  INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
  VALUES 
    (school_uuid, 'task_created', null, false, 'INSERT'),
    (school_uuid, 'task_information_needed', null, false, 'UPDATE'),
    (school_uuid, 'task_completed', null, false, 'UPDATE'),
    (school_uuid, 'task_canceled', null, false, 'UPDATE'),
    (school_uuid, 'task_overdue_reminder', null, false, 'UPDATE'),
    (school_uuid, 'task_comment_added', null, false, 'INSERT'),
    (school_uuid, 'subtask_created', null, false, 'INSERT'),
    (school_uuid, 'subtask_information_needed', null, false, 'UPDATE'),
    (school_uuid, 'subtask_completed', null, false, 'UPDATE'),
    (school_uuid, 'subtask_canceled', null, false, 'UPDATE'),
    (school_uuid, 'subtask_overdue_reminder', null, false, 'UPDATE'),
    (school_uuid, 'subtask_comment_added', null, false, 'INSERT')
  ON CONFLICT (school_id, rule_type) DO NOTHING;
END;
$function$;