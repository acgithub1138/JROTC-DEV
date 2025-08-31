-- Add new email rule types to the enum
ALTER TYPE email_rule_type ADD VALUE IF NOT EXISTS 'task_comment_added';
ALTER TYPE email_rule_type ADD VALUE IF NOT EXISTS 'subtask_comment_added';

-- Now add the email rules for existing schools
DO $$
BEGIN
  -- Add task_comment_added and subtask_comment_added to existing schools
  INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
  SELECT 
    s.id as school_id,
    'task_comment_added'::email_rule_type as rule_type,
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
    'subtask_comment_added'::email_rule_type as rule_type,
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

-- Create a function to process comment email notifications
CREATE OR REPLACE FUNCTION public.process_comment_email_notification(
  source_table_param text,
  record_id_param uuid,
  school_id_param uuid,
  commenter_id_param uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  rule_record RECORD;
  recipient_email_result RECORD;
  queue_item_id UUID;
  processed_rules integer := 0;
  failed_rules integer := 0;
  results jsonb := '{"success": true, "processed": 0, "failed": 0, "errors": []}'::jsonb;
  error_msg text;
  rule_type_param text;
  task_data RECORD;
  recipient_user_id uuid;
BEGIN
  -- Determine rule type based on source table
  IF source_table_param = 'tasks' THEN
    rule_type_param := 'task_comment_added';
  ELSIF source_table_param = 'subtasks' THEN
    rule_type_param := 'subtask_comment_added';
  ELSE
    RAISE EXCEPTION 'Invalid source table: %', source_table_param;
  END IF;

  -- Get task/subtask data to determine recipient
  IF source_table_param = 'tasks' THEN
    SELECT assigned_to, assigned_by INTO task_data
    FROM public.tasks 
    WHERE id = record_id_param;
  ELSE
    SELECT assigned_to, assigned_by INTO task_data
    FROM public.subtasks 
    WHERE id = record_id_param;
  END IF;

  IF task_data IS NULL THEN
    RAISE EXCEPTION 'Record not found in table %', source_table_param;
  END IF;

  -- Determine recipient based on who made the comment
  IF commenter_id_param = task_data.assigned_by THEN
    -- If creator commented, send to assignee
    recipient_user_id := task_data.assigned_to;
  ELSIF commenter_id_param = task_data.assigned_to THEN
    -- If assignee commented, send to creator
    recipient_user_id := task_data.assigned_by;
  ELSE
    -- Comment from someone else, don't send notification
    results := jsonb_set(results, '{processed}', to_jsonb(0));
    results := jsonb_set(results, '{failed}', to_jsonb(0));
    results := jsonb_set(results, '{success}', to_jsonb(true));
    RETURN results;
  END IF;

  -- Get recipient email using the existing email resolution
  SELECT email, source INTO recipient_email_result
  FROM public.resolve_user_email_with_job_priority(recipient_user_id, school_id_param);

  IF recipient_email_result.email IS NULL OR recipient_email_result.email = '' THEN
    failed_rules := failed_rules + 1;
    error_msg := 'No recipient email found for user ' || recipient_user_id;
    RAISE LOG '%', error_msg;
    
    results := jsonb_set(results, '{errors}', (results->'errors') || jsonb_build_array(error_msg));
    results := jsonb_set(results, '{processed}', to_jsonb(0));
    results := jsonb_set(results, '{failed}', to_jsonb(failed_rules));
    results := jsonb_set(results, '{success}', to_jsonb(false));
    RETURN results;
  END IF;

  -- Find active email rule for this operation and school
  FOR rule_record IN 
    SELECT er.id, er.template_id, er.rule_type
    FROM public.email_rules er
    WHERE er.school_id = school_id_param
      AND er.is_active = true
      AND er.rule_type = rule_type_param
      AND er.template_id IS NOT NULL
  LOOP
    BEGIN
      -- Queue the email
      SELECT public.queue_email(
        rule_record.template_id,
        recipient_email_result.email,
        source_table_param,
        record_id_param,
        school_id_param,
        rule_record.id
      ) INTO queue_item_id;
      
      processed_rules := processed_rules + 1;
      
      RAISE LOG 'Comment email queued successfully: queue_id=%, rule_id=%, recipient=%', 
        queue_item_id, rule_record.id, recipient_email_result.email;
        
    EXCEPTION WHEN OTHERS THEN
      failed_rules := failed_rules + 1;
      error_msg := 'Failed to process rule ' || rule_record.id || ': ' || SQLERRM;
      RAISE LOG '%', error_msg;
      
      results := jsonb_set(results, '{errors}', (results->'errors') || jsonb_build_array(error_msg));
    END;
  END LOOP;

  -- Update results
  results := jsonb_set(results, '{processed}', to_jsonb(processed_rules));
  results := jsonb_set(results, '{failed}', to_jsonb(failed_rules));
  results := jsonb_set(results, '{success}', to_jsonb(failed_rules = 0));

  RETURN results;
END;
$function$;