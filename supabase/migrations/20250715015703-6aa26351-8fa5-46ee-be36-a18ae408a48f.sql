-- Fix the type mismatch issue in school-specific task numbering functions

-- First, let's change the school table columns to integer type for proper arithmetic
ALTER TABLE public.schools 
ALTER COLUMN task_number TYPE integer USING COALESCE(task_number::integer, 0);

ALTER TABLE public.schools 
ALTER COLUMN subtask_number TYPE integer USING COALESCE(subtask_number::integer, 0);

-- Set default values
ALTER TABLE public.schools 
ALTER COLUMN task_number SET DEFAULT 0;

ALTER TABLE public.schools 
ALTER COLUMN subtask_number SET DEFAULT 0;

-- Update any NULL values to 0
UPDATE public.schools 
SET task_number = 0 
WHERE task_number IS NULL;

UPDATE public.schools 
SET subtask_number = 0 
WHERE subtask_number IS NULL;

-- Now recreate the functions with proper integer handling
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