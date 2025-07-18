-- Create email templates and rules for subtasks (matching the task templates)

-- First, create email templates for subtasks
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
    WHEN er.rule_type = 'task_assigned' THEN 'subtask_assigned'
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