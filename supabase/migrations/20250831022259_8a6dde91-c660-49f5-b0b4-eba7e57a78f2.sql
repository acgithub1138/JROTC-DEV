-- Drop the existing constraint and recreate it with the new rule types
ALTER TABLE public.email_rules DROP CONSTRAINT email_rules_rule_type_check;

ALTER TABLE public.email_rules ADD CONSTRAINT email_rules_rule_type_check 
CHECK (rule_type = ANY (ARRAY[
  'task_created'::text, 
  'task_information_needed'::text, 
  'task_completed'::text, 
  'task_canceled'::text, 
  'task_overdue_reminder'::text,
  'task_comment_added'::text,
  'subtask_created'::text, 
  'subtask_information_needed'::text, 
  'subtask_completed'::text, 
  'subtask_canceled'::text, 
  'subtask_overdue_reminder'::text,
  'subtask_comment_added'::text
]));

-- Now add the new email rule types for existing schools
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