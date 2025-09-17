-- Update the email_rules table constraint to include comp_registration_confirmation
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
  'subtask_comment_added',
  'comp_registration_confirmation'
));

-- Now create the email rules for competition registration confirmation
INSERT INTO email_rules (school_id, rule_type, template_id, is_active, trigger_event)
SELECT 
    s.id as school_id,
    'comp_registration_confirmation' as rule_type,
    '6e864f13-5861-4b2b-bec2-144178155ce8' as template_id,
    false as is_active,
    'INSERT' as trigger_event
FROM schools s
WHERE s.name != 'Carey Unlimited'
ON CONFLICT (school_id, rule_type) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = now();