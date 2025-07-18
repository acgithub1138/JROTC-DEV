-- Update email rules constraint to include all rule types including overdue reminders
ALTER TABLE public.email_rules DROP CONSTRAINT email_rules_rule_type_check;

-- Add comprehensive constraint that includes all rule types from the code
ALTER TABLE public.email_rules ADD CONSTRAINT email_rules_rule_type_check 
CHECK (rule_type = ANY (ARRAY[
  'task_created'::text, 
  'task_information_needed'::text, 
  'task_completed'::text, 
  'task_canceled'::text,
  'task_overdue_reminder'::text,
  'subtask_created'::text,
  'subtask_information_needed'::text, 
  'subtask_completed'::text, 
  'subtask_canceled'::text,
  'subtask_overdue_reminder'::text
]));