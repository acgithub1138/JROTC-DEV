-- Remove unused triggers and functions

-- ANALYSIS OF CURRENT STATE:
-- 1. Edge Functions in config.toml that are actively used:
--    - create-cadet-user (used in cadet management)
--    - toggle-user-status (used in user management) 
--    - reset-user-password (used in user management)
--    - email-queue-webhook (used in email processing)
--    - process-email-queue (used in email management)
--    - update-task-status-after-email (called by email-queue-webhook)

-- 2. Edge Functions that are NOT used anywhere in the codebase:
--    - test-smtp-connection (not called anywhere)
--    - manual-process-emails (not called anywhere)

-- 3. Duplicate triggers on tasks table:
--    - assign_task_number_trigger (BEFORE INSERT)
--    - task_number_trigger (BEFORE INSERT) 
--    Both call assign_task_number function - this is a duplicate!

-- 4. Obsolete functions that are no longer used:
--    - generate_task_number() - replaced by get_next_task_number()
--    - generate_subtask_number() - replaced by get_next_subtask_number()  
--    - assign_task_number() - uses obsolete generate_task_number()
--    - assign_subtask_number() - uses obsolete generate_subtask_number()

-- Remove duplicate trigger (keep the newer one)
DROP TRIGGER IF EXISTS task_number_trigger ON public.tasks;

-- Remove obsolete functions that are no longer used
DROP FUNCTION IF EXISTS public.generate_task_number();
DROP FUNCTION IF EXISTS public.generate_subtask_number();
DROP FUNCTION IF EXISTS public.assign_task_number();
DROP FUNCTION IF EXISTS public.assign_subtask_number();

-- Update the remaining triggers to use the correct modern functions
DROP TRIGGER IF EXISTS assign_task_number_trigger ON public.tasks;
DROP TRIGGER IF EXISTS subtasks_assign_number_trigger ON public.subtasks;

-- Recreate the triggers with the correct modern functions
CREATE OR REPLACE FUNCTION public.assign_task_number_modern()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.get_next_task_number(NEW.school_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

CREATE OR REPLACE FUNCTION public.assign_subtask_number_modern()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.get_next_subtask_number(NEW.school_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Create the triggers using the modern functions
CREATE TRIGGER assign_task_number_trigger
    BEFORE INSERT ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_task_number_modern();

CREATE TRIGGER assign_subtask_number_trigger
    BEFORE INSERT ON public.subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_subtask_number_modern();