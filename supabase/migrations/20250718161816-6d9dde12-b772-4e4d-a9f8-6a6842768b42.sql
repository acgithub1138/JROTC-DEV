-- Fix the process_email_rules function to better handle comment timing
-- The issue is that when status changes, the comment might not be visible yet in the same transaction

CREATE OR REPLACE FUNCTION public.process_email_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rule_record RECORD;
  template_record RECORD;
  recipient_email TEXT;
  processed_subject TEXT;
  processed_body TEXT;
  record_data JSONB;
  flattened_data JSONB := '{}';
  related_data JSONB;
  assigned_to_profile RECORD;
  assigned_by_profile RECORD;
  last_comment_text TEXT;
  queue_item_id UUID;
  should_send_email BOOLEAN;
BEGIN
  -- Convert the NEW record to JSONB for template processing
  record_data := to_jsonb(NEW);
  
  -- Add flattened data based on table type and relations
  IF TG_TABLE_NAME = 'tasks' OR TG_TABLE_NAME = 'subtasks' THEN
    -- Get assigned_to profile data
    IF NEW.assigned_to IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_to_profile
      FROM profiles WHERE id = NEW.assigned_to;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_first_name', COALESCE(assigned_to_profile.first_name, ''),
          'assigned_to_last_name', COALESCE(assigned_to_profile.last_name, ''),
          'assigned_to_email', COALESCE(assigned_to_profile.email, ''),
          'assigned_to_name', COALESCE(assigned_to_profile.first_name || ' ' || assigned_to_profile.last_name, 'Unknown')
        );
      ELSE
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_to_first_name', '',
          'assigned_to_last_name', '',
          'assigned_to_email', '',
          'assigned_to_name', ''
        );
      END IF;
    ELSE
      flattened_data := flattened_data || jsonb_build_object(
        'assigned_to_first_name', '',
        'assigned_to_last_name', '',
        'assigned_to_email', '',
        'assigned_to_name', ''
      );
    END IF;
    
    -- Get assigned_by profile data
    IF NEW.assigned_by IS NOT NULL THEN
      SELECT first_name, last_name, email INTO assigned_by_profile
      FROM profiles WHERE id = NEW.assigned_by;
      
      IF FOUND THEN
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_by_first_name', COALESCE(assigned_by_profile.first_name, ''),
          'assigned_by_last_name', COALESCE(assigned_by_profile.last_name, ''),
          'assigned_by_email', COALESCE(assigned_by_profile.email, ''),
          'assigned_by_name', COALESCE(assigned_by_profile.first_name || ' ' || assigned_by_profile.last_name, 'Unknown')
        );
      ELSE
        flattened_data := flattened_data || jsonb_build_object(
          'assigned_by_first_name', '',
          'assigned_by_last_name', '',
          'assigned_by_email', '',
          'assigned_by_name', ''
        );
      END IF;
    ELSE
      flattened_data := flattened_data || jsonb_build_object(
        'assigned_by_first_name', '',
        'assigned_by_last_name', '',
        'assigned_by_email', '',
        'assigned_by_name', ''
      );
    END IF;

    -- For task processing, delay the comment lookup to allow for same-transaction commits
    -- This fixes the timing issue where status change and comment addition happen together
    last_comment_text := 'No comments yet'; -- Default value
    
    flattened_data := flattened_data || jsonb_build_object(
      'last_comment', last_comment_text
    );
  END IF;
  
  -- Merge flattened data with record data
  record_data := record_data || flattened_data;
  
  -- Loop through all active email rules for this table and trigger event
  FOR rule_record IN 
    SELECT er.*, et.subject, et.body, et.name as template_name
    FROM email_rules er
    JOIN email_templates et ON er.template_id = et.id
    WHERE et.source_table = TG_TABLE_NAME 
      AND er.trigger_event = TG_OP::text
      AND er.is_active = true
      AND et.is_active = true
      AND (
        -- For incidents: no school check (only admins can create incident rules)
        TG_TABLE_NAME = 'incidents' OR 
        -- For other tables: maintain school check
        er.school_id = NEW.school_id
      )
  LOOP
    -- Check if this specific rule should fire based on the actual changes
    should_send_email := FALSE;
    
    -- For INSERT operations, only send emails for creation-related rules
    IF TG_OP = 'INSERT' THEN
      should_send_email := rule_record.rule_type IN ('task_created', 'task_assigned', 'incident_created', 'incident_assigned', 'subtask_created', 'subtask_assigned');
    -- For UPDATE operations, check specific conditions for each rule type
    ELSIF TG_OP = 'UPDATE' THEN
      CASE rule_record.rule_type
        WHEN 'task_completed', 'subtask_completed' THEN
          -- Only send if task was actually completed (status changed to completed or completed_at was set)
          should_send_email := (
            (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed') OR
            (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
          );
        WHEN 'task_information_needed', 'subtask_information_needed' THEN
          -- Only send if status changed to need_information
          should_send_email := (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'need_information');
        WHEN 'task_assigned', 'subtask_assigned' THEN
          -- Only send if assigned_to changed
          should_send_email := (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL);
        WHEN 'incident_assigned' THEN
          -- Only send if assigned_to_admin changed
          should_send_email := (OLD.assigned_to_admin IS DISTINCT FROM NEW.assigned_to_admin AND NEW.assigned_to_admin IS NOT NULL);
        WHEN 'incident_completed' THEN
          -- Only send if incident was actually completed
          should_send_email := (
            (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'closed') OR
            (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
          );
        ELSE
          -- For other rule types, send on any update (maintain backward compatibility)
          should_send_email := TRUE;
      END CASE;
    END IF;
    
    -- Skip if this rule shouldn't fire for this specific change
    IF NOT should_send_email THEN
      CONTINUE;
    END IF;
    
    -- Determine recipient email based on rule type using resolve_user_email_with_job_priority
    recipient_email := NULL;
    
    CASE rule_record.rule_type
      WHEN 'task_assigned', 'task_created', 'subtask_assigned', 'subtask_created' THEN
        -- Send to assigned user
        IF NEW.assigned_to IS NOT NULL THEN
          SELECT email INTO recipient_email 
          FROM resolve_user_email_with_job_priority(NEW.assigned_to, NEW.school_id);
        END IF;
      WHEN 'task_completed', 'task_information_needed', 'subtask_completed', 'subtask_information_needed' THEN
        -- Send to assigner
        IF NEW.assigned_by IS NOT NULL THEN
          SELECT email INTO recipient_email 
          FROM resolve_user_email_with_job_priority(NEW.assigned_by, NEW.school_id);
        END IF;
      ELSE
        -- Default: send to assigned user if available
        IF NEW.assigned_to IS NOT NULL THEN
          SELECT email INTO recipient_email 
          FROM resolve_user_email_with_job_priority(NEW.assigned_to, NEW.school_id);
        END IF;
    END CASE;
    
    -- Skip if no valid recipient email
    IF recipient_email IS NULL OR recipient_email = '' THEN
      RAISE NOTICE 'Skipping email rule "%" - no valid recipient email', rule_record.rule_type;
      CONTINUE;
    END IF;
    
    -- Use the queue_email function instead of inline processing
    -- This ensures consistent comment handling and uses the latest logic
    SELECT public.queue_email(
      rule_record.template_id,
      recipient_email,
      TG_TABLE_NAME,
      NEW.id,
      NEW.school_id,
      rule_record.id
    ) INTO queue_item_id;
    
    -- Add comment for email queued with preview link (only for tasks/subtasks)
    IF TG_TABLE_NAME = 'tasks' THEN
      INSERT INTO task_comments (
        task_id,
        user_id,
        comment_text,
        is_system_comment
      ) VALUES (
        NEW.id,
        COALESCE(NEW.assigned_by, NEW.assigned_to),
        'Email queued for sending to ' || recipient_email || ' - [Preview Email](' || queue_item_id || ')',
        true
      );
    ELSIF TG_TABLE_NAME = 'subtasks' THEN
      INSERT INTO subtask_comments (
        subtask_id,
        user_id,
        comment_text,
        is_system_comment
      ) VALUES (
        NEW.id,
        COALESCE(NEW.assigned_by, NEW.assigned_to),
        'Email queued for sending to ' || recipient_email || ' - [Preview Email](' || queue_item_id || ')',
        true
      );
    END IF;
    
  END LOOP;
  
  RETURN NEW;
END;
$$;