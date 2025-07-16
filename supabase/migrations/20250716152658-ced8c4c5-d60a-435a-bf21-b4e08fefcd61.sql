-- Recreate the email processing system to work with the new email_rules table structure

-- Create the email processing function for the new simplified email_rules table
CREATE OR REPLACE FUNCTION public.process_email_rules() 
RETURNS trigger AS $$
DECLARE
  email_rule RECORD;
  template_record RECORD;
  recipient_email TEXT;
  rule_type_to_check TEXT;
  status_changed BOOLEAN := false;
  old_status TEXT;
  new_status TEXT;
BEGIN
  -- Only process INSERT and UPDATE events
  IF TG_OP NOT IN ('INSERT', 'UPDATE') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- For tasks table, determine rule type based on operation and status changes
  IF TG_TABLE_NAME = 'tasks' THEN
    IF TG_OP = 'INSERT' THEN
      rule_type_to_check := 'task_created';
    ELSIF TG_OP = 'UPDATE' THEN
      old_status := OLD.status;
      new_status := NEW.status;
      
      -- Check if status actually changed
      IF old_status IS DISTINCT FROM new_status THEN
        status_changed := true;
        
        -- Map status to rule type
        CASE new_status
          WHEN 'completed' THEN rule_type_to_check := 'task_completed';
          WHEN 'canceled', 'cancelled' THEN rule_type_to_check := 'task_canceled';
          WHEN 'information_needed' THEN rule_type_to_check := 'task_information_needed';
          ELSE rule_type_to_check := NULL; -- No rule for other status changes
        END CASE;
      ELSE
        -- Status didn't change, no email rules to process
        RETURN NEW;
      END IF;
    END IF;
  ELSE
    -- For other tables, default to created rule
    rule_type_to_check := TG_TABLE_NAME || '_created';
  END IF;

  -- Skip if no rule type determined
  IF rule_type_to_check IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Process each active email rule that matches the event
  FOR email_rule IN 
    SELECT er.*, et.subject, et.body, et.source_table
    FROM public.email_rules er
    JOIN public.email_templates et ON er.template_id = et.id
    WHERE er.school_id = COALESCE(NEW.school_id, OLD.school_id)
      AND er.rule_type = rule_type_to_check
      AND er.trigger_event = TG_OP
      AND er.is_active = true
      AND et.is_active = true
      AND et.source_table = TG_TABLE_NAME
  LOOP
    -- Determine recipient email based on rule type and task data
    recipient_email := NULL;
    
    IF TG_TABLE_NAME = 'tasks' THEN
      CASE email_rule.rule_type
        WHEN 'task_created' THEN
          -- Send to assigned person (if assigned) or the person who assigned it
          IF NEW.assigned_to IS NOT NULL THEN
            SELECT email INTO recipient_email 
            FROM public.profiles 
            WHERE id = NEW.assigned_to;
          ELSIF NEW.assigned_by IS NOT NULL THEN
            SELECT email INTO recipient_email 
            FROM public.profiles 
            WHERE id = NEW.assigned_by;
          END IF;
          
        WHEN 'task_completed', 'task_canceled' THEN
          -- Send to the person who assigned the task
          IF NEW.assigned_by IS NOT NULL THEN
            SELECT email INTO recipient_email 
            FROM public.profiles 
            WHERE id = NEW.assigned_by;
          END IF;
          
        WHEN 'task_information_needed' THEN
          -- Send to the assigned person
          IF NEW.assigned_to IS NOT NULL THEN
            SELECT email INTO recipient_email 
            FROM public.profiles 
            WHERE id = NEW.assigned_to;
          END IF;
      END CASE;
    END IF;

    -- Only proceed if we have a recipient email
    IF recipient_email IS NOT NULL AND recipient_email != '' THEN
      BEGIN
        -- Queue the email using the existing queue_email function
        PERFORM public.queue_email(
          email_rule.template_id,
          recipient_email,
          TG_TABLE_NAME,
          NEW.id,
          COALESCE(NEW.school_id, OLD.school_id)
        );
        
        -- Add a system comment to the task indicating email was queued
        IF TG_TABLE_NAME = 'tasks' THEN
          INSERT INTO public.task_comments (
            task_id,
            user_id,
            comment_text,
            is_system_comment
          ) VALUES (
            NEW.id,
            auth.uid(),
            'Email notification queued: ' || email_rule.rule_type || ' (' || recipient_email || ')',
            true
          );
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE WARNING 'Failed to queue email for rule %: %', email_rule.id, SQLERRM;
      END;
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for tasks table
DROP TRIGGER IF EXISTS tasks_email_rules_insert_trigger ON public.tasks;
DROP TRIGGER IF EXISTS tasks_email_rules_update_trigger ON public.tasks;

CREATE TRIGGER tasks_email_rules_insert_trigger
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

CREATE TRIGGER tasks_email_rules_update_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();