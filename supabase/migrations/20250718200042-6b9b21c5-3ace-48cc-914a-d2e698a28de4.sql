-- Insert missing subtask_canceled rules for all schools that have other subtask rules
INSERT INTO public.email_rules (
  rule_type,
  trigger_event,
  is_active,
  school_id,
  template_id
)
SELECT 
  'subtask_canceled' as rule_type,
  'UPDATE' as trigger_event,
  false as is_active,  -- Start disabled until template is selected
  school_id,
  NULL as template_id
FROM (
  SELECT DISTINCT school_id 
  FROM public.email_rules 
  WHERE rule_type LIKE 'subtask_%'
) schools
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_rules er2 
  WHERE er2.rule_type = 'subtask_canceled' 
  AND er2.school_id = schools.school_id
);