-- Add subtask_overdue_reminder rule type to the constraint
ALTER TABLE public.email_rules DROP CONSTRAINT IF EXISTS email_rules_rule_type_check;

ALTER TABLE public.email_rules ADD CONSTRAINT email_rules_rule_type_check 
CHECK (rule_type IN (
    'task_created', 
    'task_information_needed', 
    'task_completed', 
    'task_canceled',
    'task_overdue_reminder',
    'subtask_created', 
    'subtask_information_needed', 
    'subtask_completed', 
    'subtask_canceled',
    'subtask_overdue_reminder'
));

-- Add the subtask overdue reminder rules for all schools
DO $$
DECLARE
    school_record RECORD;
BEGIN
    -- Loop through all schools and create the subtask_overdue_reminder rule
    FOR school_record IN SELECT id FROM public.schools LOOP
        -- Insert the new rule if it doesn't already exist
        INSERT INTO public.email_rules (
            school_id,
            rule_type,
            trigger_event,
            is_active,
            template_id
        )
        SELECT 
            school_record.id,
            'subtask_overdue_reminder',
            'SCHEDULED',
            false,
            NULL
        WHERE NOT EXISTS (
            SELECT 1 FROM public.email_rules 
            WHERE school_id = school_record.id 
            AND rule_type = 'subtask_overdue_reminder'
        );
    END LOOP;
END $$;

-- Create a table to track subtask overdue reminder emails to prevent duplicates
CREATE TABLE IF NOT EXISTS public.subtask_overdue_reminders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subtask_id UUID NOT NULL,
    school_id UUID NOT NULL,
    reminder_type TEXT NOT NULL, -- '3_days', '2_days', '1_day', 'due_date'
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    email_queue_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subtask_overdue_reminders_subtask_id ON public.subtask_overdue_reminders(subtask_id);
CREATE INDEX IF NOT EXISTS idx_subtask_overdue_reminders_school_id ON public.subtask_overdue_reminders(school_id);
CREATE INDEX IF NOT EXISTS idx_subtask_overdue_reminders_reminder_type ON public.subtask_overdue_reminders(reminder_type);

-- Enable RLS
ALTER TABLE public.subtask_overdue_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view subtask reminders from their school"
ON public.subtask_overdue_reminders
FOR SELECT
USING (school_id = get_current_user_school_id());

CREATE POLICY "System can insert subtask reminder records"
ON public.subtask_overdue_reminders
FOR INSERT
WITH CHECK (true); -- Allow system to insert for any school

-- Update the function to also process subtask overdue reminders
CREATE OR REPLACE FUNCTION public.process_overdue_task_reminders()
RETURNS TABLE(
    processed_count INTEGER,
    school_id UUID,
    reminder_type TEXT,
    tasks_found INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rule_record RECORD;
    task_record RECORD;
    subtask_record RECORD;
    template_record RECORD;
    queue_id UUID;
    total_processed INTEGER := 0;
    current_date_utc DATE;
    recipient_email_result TEXT;
BEGIN
    -- Get current date in UTC
    current_date_utc := CURRENT_DATE;
    
    -- Process all active TASK overdue reminder rules
    FOR rule_record IN 
        SELECT er.*, et.name as template_name, et.subject, et.body
        FROM public.email_rules er
        JOIN public.email_templates et ON er.template_id = et.id
        WHERE er.rule_type = 'task_overdue_reminder'
          AND er.is_active = true
          AND et.is_active = true
          AND et.source_table = 'tasks'
    LOOP
        -- Process tasks for different reminder intervals
        FOR task_record IN 
            SELECT t.*, 
                   DATE(t.due_date) as due_date_only,
                   CASE 
                       WHEN DATE(t.due_date) = current_date_utc + INTERVAL '3 days' THEN '3_days'
                       WHEN DATE(t.due_date) = current_date_utc + INTERVAL '2 days' THEN '2_days'
                       WHEN DATE(t.due_date) = current_date_utc + INTERVAL '1 day' THEN '1_day'
                       WHEN DATE(t.due_date) = current_date_utc THEN 'due_date'
                   END as reminder_type
            FROM public.tasks t
            WHERE t.school_id = rule_record.school_id
              AND t.due_date IS NOT NULL
              AND t.status NOT IN ('completed', 'canceled')
              AND t.assigned_to IS NOT NULL
              AND (
                  DATE(t.due_date) = current_date_utc + INTERVAL '3 days' OR
                  DATE(t.due_date) = current_date_utc + INTERVAL '2 days' OR
                  DATE(t.due_date) = current_date_utc + INTERVAL '1 day' OR
                  DATE(t.due_date) = current_date_utc
              )
              -- Don't send duplicate reminders
              AND NOT EXISTS (
                  SELECT 1 FROM public.task_overdue_reminders tor
                  WHERE tor.task_id = t.id 
                    AND tor.reminder_type = CASE 
                        WHEN DATE(t.due_date) = current_date_utc + INTERVAL '3 days' THEN '3_days'
                        WHEN DATE(t.due_date) = current_date_utc + INTERVAL '2 days' THEN '2_days'
                        WHEN DATE(t.due_date) = current_date_utc + INTERVAL '1 day' THEN '1_day'
                        WHEN DATE(t.due_date) = current_date_utc THEN 'due_date'
                    END
                    AND DATE(tor.sent_at) = current_date_utc
              )
        LOOP
            -- Get recipient email using the helper function
            SELECT email INTO recipient_email_result 
            FROM public.resolve_user_email_with_job_priority(task_record.assigned_to, task_record.school_id);
            
            -- Skip if no valid email found
            IF recipient_email_result IS NULL OR recipient_email_result = '' THEN
                CONTINUE;
            END IF;
            
            -- Queue the reminder email
            SELECT public.queue_email(
                rule_record.template_id,
                recipient_email_result,
                'tasks',
                task_record.id,
                task_record.school_id,
                rule_record.id
            ) INTO queue_id;
            
            -- Record that we sent this reminder
            INSERT INTO public.task_overdue_reminders (
                task_id,
                school_id,
                reminder_type,
                email_queue_id
            ) VALUES (
                task_record.id,
                task_record.school_id,
                task_record.reminder_type,
                queue_id
            );
            
            total_processed := total_processed + 1;
            
            -- Return processing info
            RETURN QUERY SELECT 
                total_processed,
                task_record.school_id,
                task_record.reminder_type,
                1;
        END LOOP;
    END LOOP;
    
    -- Process all active SUBTASK overdue reminder rules
    FOR rule_record IN 
        SELECT er.*, et.name as template_name, et.subject, et.body
        FROM public.email_rules er
        JOIN public.email_templates et ON er.template_id = et.id
        WHERE er.rule_type = 'subtask_overdue_reminder'
          AND er.is_active = true
          AND et.is_active = true
          AND et.source_table = 'subtasks'
    LOOP
        -- Process subtasks for different reminder intervals
        FOR subtask_record IN 
            SELECT s.*, 
                   DATE(s.due_date) as due_date_only,
                   CASE 
                       WHEN DATE(s.due_date) = current_date_utc + INTERVAL '3 days' THEN '3_days'
                       WHEN DATE(s.due_date) = current_date_utc + INTERVAL '2 days' THEN '2_days'
                       WHEN DATE(s.due_date) = current_date_utc + INTERVAL '1 day' THEN '1_day'
                       WHEN DATE(s.due_date) = current_date_utc THEN 'due_date'
                   END as reminder_type
            FROM public.subtasks s
            WHERE s.school_id = rule_record.school_id
              AND s.due_date IS NOT NULL
              AND s.status NOT IN ('completed', 'canceled')
              AND s.assigned_to IS NOT NULL
              AND (
                  DATE(s.due_date) = current_date_utc + INTERVAL '3 days' OR
                  DATE(s.due_date) = current_date_utc + INTERVAL '2 days' OR
                  DATE(s.due_date) = current_date_utc + INTERVAL '1 day' OR
                  DATE(s.due_date) = current_date_utc
              )
              -- Don't send duplicate reminders
              AND NOT EXISTS (
                  SELECT 1 FROM public.subtask_overdue_reminders sor
                  WHERE sor.subtask_id = s.id 
                    AND sor.reminder_type = CASE 
                        WHEN DATE(s.due_date) = current_date_utc + INTERVAL '3 days' THEN '3_days'
                        WHEN DATE(s.due_date) = current_date_utc + INTERVAL '2 days' THEN '2_days'
                        WHEN DATE(s.due_date) = current_date_utc + INTERVAL '1 day' THEN '1_day'
                        WHEN DATE(s.due_date) = current_date_utc THEN 'due_date'
                    END
                    AND DATE(sor.sent_at) = current_date_utc
              )
        LOOP
            -- Get recipient email using the helper function
            SELECT email INTO recipient_email_result 
            FROM public.resolve_user_email_with_job_priority(subtask_record.assigned_to, subtask_record.school_id);
            
            -- Skip if no valid email found
            IF recipient_email_result IS NULL OR recipient_email_result = '' THEN
                CONTINUE;
            END IF;
            
            -- Queue the reminder email
            SELECT public.queue_email(
                rule_record.template_id,
                recipient_email_result,
                'subtasks',
                subtask_record.id,
                subtask_record.school_id,
                rule_record.id
            ) INTO queue_id;
            
            -- Record that we sent this reminder
            INSERT INTO public.subtask_overdue_reminders (
                subtask_id,
                school_id,
                reminder_type,
                email_queue_id
            ) VALUES (
                subtask_record.id,
                subtask_record.school_id,
                subtask_record.reminder_type,
                queue_id
            );
            
            total_processed := total_processed + 1;
            
            -- Return processing info
            RETURN QUERY SELECT 
                total_processed,
                subtask_record.school_id,
                subtask_record.reminder_type,
                1;
        END LOOP;
    END LOOP;
    
    -- Return summary if no tasks processed
    IF total_processed = 0 THEN
        RETURN QUERY SELECT 0, NULL::UUID, 'none'::TEXT, 0;
    END IF;
END;
$$;