-- Create sequence for task numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS task_number_seq START WITH 1;

-- Create the generate_task_number function
CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('task_number_seq') INTO next_num;
    RETURN 'TSK' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Create the trigger function for auto-assigning task numbers
CREATE OR REPLACE FUNCTION public.assign_task_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := generate_task_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger on tasks table
DROP TRIGGER IF EXISTS assign_task_number_trigger ON public.tasks;
CREATE TRIGGER assign_task_number_trigger
    BEFORE INSERT ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_task_number();