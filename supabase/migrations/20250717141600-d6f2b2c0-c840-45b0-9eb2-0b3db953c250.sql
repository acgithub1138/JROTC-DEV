-- Remove unused triggers and functions (fixed order)

-- First drop the triggers that depend on the functions
DROP TRIGGER IF EXISTS assign_task_number_trigger ON public.tasks;
DROP TRIGGER IF EXISTS task_number_trigger ON public.tasks;
DROP TRIGGER IF EXISTS subtasks_assign_number_trigger ON public.subtasks;

-- Now we can safely drop the obsolete functions
DROP FUNCTION IF EXISTS public.generate_task_number();
DROP FUNCTION IF EXISTS public.generate_subtask_number();
DROP FUNCTION IF EXISTS public.assign_task_number();
DROP FUNCTION IF EXISTS public.assign_subtask_number();

-- Create modern replacement functions
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

-- Create the new triggers using the modern functions
CREATE TRIGGER assign_task_number_trigger
    BEFORE INSERT ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_task_number_modern();

CREATE TRIGGER assign_subtask_number_trigger
    BEFORE INSERT ON public.subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_subtask_number_modern();