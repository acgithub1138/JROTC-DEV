-- Fix email rules to distinguish between completion and cancellation
CREATE OR REPLACE FUNCTION public.process_email_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      FROM public.profiles WHERE id = NEW.assigned_to;
      
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
      FROM public.profiles WHERE id = NEW.assigned_by;
      
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
    FROM public.email_rules er
    JOIN public.email_templates et ON er.template_id = et.id
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
          -- FIXED: Only send if task was actually completed (status changed to completed)
          -- Don't trigger on completed_at being set if the status is not "completed"
          should_send_email := (
            OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed'
          );
        
        WHEN 'task_canceled', 'subtask_canceled' THEN
          -- Only send if task was actually canceled (status changed to canceled)
          should_send_email := (
            OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'canceled'
          );
        
        WHEN 'task_assigned', 'subtask_assigned' THEN
          -- Only send if assigned_to actually changed
          should_send_email := (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL);
        
        WHEN 'task_priority_changed', 'subtask_priority_changed' THEN
          -- Only send if priority actually changed
          should_send_email := (OLD.priority IS DISTINCT FROM NEW.priority);
        
        WHEN 'task_due_date_changed', 'subtask_due_date_changed' THEN
          -- Only send if due_date actually changed
          should_send_email := (OLD.due_date IS DISTINCT FROM NEW.due_date);
        
        WHEN 'task_status_changed', 'subtask_status_changed' THEN
          -- Only send if status actually changed (excluding completion and cancellation as they have their own rules)
          should_send_email := (
            OLD.status IS DISTINCT FROM NEW.status AND 
            NEW.status NOT IN ('completed', 'canceled')
          );
        
        WHEN 'incident_assigned' THEN
          should_send_email := (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL);
        
        WHEN 'incident_status_changed' THEN
          should_send_email := (OLD.status IS DISTINCT FROM NEW.status);
        
        WHEN 'incident_priority_changed' THEN
          should_send_email := (OLD.priority IS DISTINCT FROM NEW.priority);
          
        ELSE
          -- For other rule types, don't send on update
          should_send_email := FALSE;
      END CASE;
    END IF;
    
    -- If we should send an email for this rule, queue it
    IF should_send_email THEN
      -- Process template variables
      processed_subject := rule_record.subject;
      processed_body := rule_record.body;
      
      -- Replace template variables with actual data
      SELECT 
        public.replace_template_variables(processed_subject, record_data),
        public.replace_template_variables(processed_body, record_data)
      INTO processed_subject, processed_body;
      
      -- Determine recipient email
      CASE rule_record.recipient_type
        WHEN 'assigned_to' THEN
          recipient_email := (flattened_data->>'assigned_to_email')::text;
        WHEN 'assigned_by' THEN
          recipient_email := (flattened_data->>'assigned_by_email')::text;
        WHEN 'school_admin' THEN
          -- Get the first admin email for this school
          SELECT p.email INTO recipient_email
          FROM public.profiles p
          JOIN public.user_school_roles usr ON p.id = usr.user_id
          WHERE usr.school_id = NEW.school_id
            AND usr.role = 'admin'
            AND p.email IS NOT NULL
          LIMIT 1;
        WHEN 'custom' THEN
          recipient_email := rule_record.recipient_email;
        ELSE
          recipient_email := NULL;
      END CASE;
      
      -- Only queue if we have a valid recipient email
      IF recipient_email IS NOT NULL AND recipient_email != '' THEN
        -- Insert into email queue
        INSERT INTO public.email_queue (
          recipient_email,
          subject,
          body,
          rule_type,
          related_table,
          related_id,
          school_id,
          template_data
        ) VALUES (
          recipient_email,
          processed_subject,
          processed_body,
          rule_record.rule_type,
          TG_TABLE_NAME,
          NEW.id,
          NEW.school_id,
          record_data
        ) RETURNING id INTO queue_item_id;
        
        -- Log the queued email
        RAISE LOG 'Email queued (ID: %) for rule type: %, recipient: %, table: %, record ID: %', 
          queue_item_id, rule_record.rule_type, recipient_email, TG_TABLE_NAME, NEW.id;
      ELSE
        RAISE LOG 'Skipping email for rule type: % - no valid recipient email found (type: %, email: %)', 
          rule_record.rule_type, rule_record.recipient_type, recipient_email;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;