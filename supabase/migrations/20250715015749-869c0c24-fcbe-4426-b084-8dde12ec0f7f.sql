-- Fix the type conversion issue step by step

-- First, remove the default constraints
ALTER TABLE public.schools 
ALTER COLUMN task_number DROP DEFAULT;

ALTER TABLE public.schools 
ALTER COLUMN subtask_number DROP DEFAULT;

-- Convert text to integer, handling any non-numeric values
UPDATE public.schools 
SET task_number = CASE 
    WHEN task_number ~ '^[0-9]+$' THEN task_number::integer::text
    ELSE '0'
END;

UPDATE public.schools 
SET subtask_number = CASE 
    WHEN subtask_number ~ '^[0-9]+$' THEN subtask_number::integer::text
    ELSE '0'
END;

-- Now convert the column types
ALTER TABLE public.schools 
ALTER COLUMN task_number TYPE integer USING task_number::integer;

ALTER TABLE public.schools 
ALTER COLUMN subtask_number TYPE integer USING subtask_number::integer;

-- Set new default values
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