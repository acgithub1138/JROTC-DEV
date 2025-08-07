-- Add missing email rules for School 02
INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
VALUES 
  ('9dd7807c-8ba4-41c7-91a8-16f0408c7435', 'subtask_created', null, false, 'INSERT'),
  ('9dd7807c-8ba4-41c7-91a8-16f0408c7435', 'subtask_information_needed', null, false, 'UPDATE'),
  ('9dd7807c-8ba4-41c7-91a8-16f0408c7435', 'subtask_completed', null, false, 'UPDATE');