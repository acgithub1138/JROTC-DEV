-- Phase 3: Performance & Polish - Database optimizations and enhancements

-- Add indexes for better performance on email rules queries
CREATE INDEX IF NOT EXISTS idx_email_rules_school_rule_type 
ON public.email_rules (school_id, rule_type, is_active);

CREATE INDEX IF NOT EXISTS idx_email_rules_trigger_event 
ON public.email_rules (trigger_event, is_active);

CREATE INDEX IF NOT EXISTS idx_email_templates_school_source 
ON public.email_templates (school_id, source_table, is_active);

-- Add email rule usage tracking table
CREATE TABLE IF NOT EXISTS public.email_rule_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.email_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trigger_table TEXT NOT NULL,
  trigger_operation TEXT NOT NULL,
  record_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  processing_time_ms INTEGER,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE
);

-- Add indexes for usage log queries
CREATE INDEX IF NOT EXISTS idx_email_rule_usage_log_rule_id 
ON public.email_rule_usage_log (rule_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_rule_usage_log_school_date 
ON public.email_rule_usage_log (school_id, triggered_at DESC);

-- Enable RLS on usage log
ALTER TABLE public.email_rule_usage_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usage log
CREATE POLICY "Users can view rule usage logs from their school" 
ON public.email_rule_usage_log 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "System can insert rule usage logs" 
ON public.email_rule_usage_log 
FOR INSERT 
WITH CHECK (school_id = get_current_user_school_id());

-- Create a function to track rule usage and update the email processing function
CREATE OR REPLACE FUNCTION public.log_email_rule_usage(
  p_rule_id UUID,
  p_trigger_table TEXT,
  p_trigger_operation TEXT,
  p_record_id UUID,
  p_recipient_email TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_processing_time_ms INTEGER DEFAULT NULL,
  p_school_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.email_rule_usage_log (
    rule_id,
    trigger_table,
    trigger_operation,
    record_id,
    recipient_email,
    success,
    error_message,
    processing_time_ms,
    school_id
  ) VALUES (
    p_rule_id,
    p_trigger_table,
    p_trigger_operation,
    p_record_id,
    p_recipient_email,
    p_success,
    p_error_message,
    p_processing_time_ms,
    COALESCE(p_school_id, get_current_user_school_id())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the email processing function to include usage tracking and performance optimization
CREATE OR REPLACE FUNCTION public.process_email_rules() 
RETURNS trigger AS $$
DECLARE
  email_rule RECORD;
  recipient_email TEXT;
  rule_type_to_check TEXT;
  old_status TEXT;
  new_status TEXT;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  processing_time_ms INTEGER;
  queue_id UUID;
BEGIN
  start_time := clock_timestamp();
  
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
        -- Map status to rule type
        CASE new_status
          WHEN 'completed' THEN rule_type_to_check := 'task_completed';
          WHEN 'canceled', 'cancelled' THEN rule_type_to_check := 'task_canceled';
          WHEN 'information_needed' THEN rule_type_to_check := 'task_information_needed';
          ELSE rule_type_to_check := NULL;
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

  -- Process each active email rule (optimized query with indexes)
  FOR email_rule IN 
    SELECT er.id, er.rule_type, er.template_id, et.subject, et.body, et.source_table
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
        SELECT public.queue_email(
          email_rule.template_id,
          recipient_email,
          TG_TABLE_NAME,
          NEW.id,
          COALESCE(NEW.school_id, OLD.school_id)
        ) INTO queue_id;
        
        -- Calculate processing time
        end_time := clock_timestamp();
        processing_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        -- Log successful rule usage
        PERFORM public.log_email_rule_usage(
          email_rule.id,
          TG_TABLE_NAME,
          TG_OP,
          NEW.id,
          recipient_email,
          true,
          NULL,
          processing_time_ms,
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
            COALESCE(auth.uid(), NEW.assigned_by, NEW.created_by),
            'Email notification sent: ' || email_rule.rule_type || ' to ' || recipient_email,
            true
          );
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        -- Calculate processing time for failed operation
        end_time := clock_timestamp();
        processing_time_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        -- Log failed rule usage
        PERFORM public.log_email_rule_usage(
          email_rule.id,
          TG_TABLE_NAME,
          TG_OP,
          NEW.id,
          recipient_email,
          false,
          SQLERRM,
          processing_time_ms,
          COALESCE(NEW.school_id, OLD.school_id)
        );
        
        -- Log error but don't fail the main operation
        RAISE WARNING 'Failed to queue email for rule %: %', email_rule.id, SQLERRM;
      END;
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;