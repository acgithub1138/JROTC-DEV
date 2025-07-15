-- Update the functions to work with integer types properly
CREATE OR REPLACE FUNCTION public.get_next_task_number(school_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Atomically increment and get the next task number for the school
    UPDATE public.schools 
    SET task_number = task_number + 1
    WHERE id = school_uuid
    RETURNING task_number INTO next_num;
    
    -- If school not found, return error
    IF next_num IS NULL THEN
        RAISE EXCEPTION 'School with ID % not found', school_uuid;
    END IF;
    
    RETURN 'TSK' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Function to atomically get next subtask number for a school
CREATE OR REPLACE FUNCTION public.get_next_subtask_number(school_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Atomically increment and get the next subtask number for the school
    UPDATE public.schools 
    SET subtask_number = subtask_number + 1
    WHERE id = school_uuid
    RETURNING subtask_number INTO next_num;
    
    -- If school not found, return error
    IF next_num IS NULL THEN
        RAISE EXCEPTION 'School with ID % not found', school_uuid;
    END IF;
    
    RETURN 'STSK' || LPAD(next_num::TEXT, 5, '0');
END;
$$;