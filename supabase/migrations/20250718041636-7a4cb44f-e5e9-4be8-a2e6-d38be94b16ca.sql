-- First, drop the existing constraint and add a new one that supports both task and subtask rule types
ALTER TABLE public.email_rules DROP CONSTRAINT email_rules_rule_type_check;

-- Add new constraint that supports both task and subtask rule types
ALTER TABLE public.email_rules ADD CONSTRAINT email_rules_rule_type_check 
CHECK (rule_type = ANY (ARRAY[
  'task_created'::text, 
  'task_information_needed'::text, 
  'task_completed'::text, 
  'task_canceled'::text,
  'subtask_created'::text,
  'subtask_information_needed'::text, 
  'subtask_completed'::text, 
  'subtask_canceled'::text
]));

-- Now create email templates for subtasks
INSERT INTO public.email_templates (
  name,
  subject,
  body,
  source_table,
  school_id,
  is_active,
  created_by
) 
SELECT 
  REPLACE(name, 'Task', 'Subtask') as name,
  REPLACE(subject, 'task_number', 'task_number') as subject, -- subtasks also use task_number field
  REPLACE(body, 'task', 'subtask') as body,
  'subtasks' as source_table,
  school_id,
  is_active,
  created_by
FROM public.email_templates 
WHERE source_table = 'tasks';

-- Create email rules for subtasks (matching the task rules)
INSERT INTO public.email_rules (
  rule_type,
  trigger_event,
  is_active,
  school_id,
  template_id
)
SELECT 
  CASE 
    WHEN er.rule_type = 'task_completed' THEN 'subtask_completed'
    WHEN er.rule_type = 'task_created' THEN 'subtask_created' 
    WHEN er.rule_type = 'task_canceled' THEN 'subtask_canceled'
    WHEN er.rule_type = 'task_information_needed' THEN 'subtask_information_needed'
    ELSE er.rule_type
  END as rule_type,
  er.trigger_event,
  er.is_active,
  er.school_id,
  st.id as template_id
FROM public.email_rules er
JOIN public.email_templates et ON er.template_id = et.id
JOIN public.email_templates st ON st.source_table = 'subtasks' 
  AND REPLACE(st.name, 'Subtask', 'Task') = et.name
  AND st.school_id = et.school_id
WHERE et.source_table = 'tasks';