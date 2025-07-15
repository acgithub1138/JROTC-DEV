-- Phase 1: Create school-specific task number generation functions

-- Function to atomically get next task number for a school
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
    SET task_number = COALESCE(task_number, 0) + 1
    WHERE id = school_uuid
    RETURNING task_number INTO next_num;
    
    -- If school not found or task_number is null, initialize to 1
    IF next_num IS NULL THEN
        UPDATE public.schools 
        SET task_number = 1
        WHERE id = school_uuid;
        next_num := 1;
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
    SET subtask_number = COALESCE(subtask_number, 0) + 1
    WHERE id = school_uuid
    RETURNING subtask_number INTO next_num;
    
    -- If school not found or subtask_number is null, initialize to 1
    IF next_num IS NULL THEN
        UPDATE public.schools 
        SET subtask_number = 1
        WHERE id = school_uuid;
        next_num := 1;
    END IF;
    
    RETURN 'STSK' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Update the generate_task_number function to use school-specific numbering
CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    -- This function is now deprecated - use get_next_task_number instead
    -- Keeping for backwards compatibility but will error if called
    RAISE EXCEPTION 'generate_task_number() is deprecated. Use get_next_task_number(school_id) instead.';
END;
$$;

-- Update the generate_subtask_number function to use school-specific numbering
CREATE OR REPLACE FUNCTION public.generate_subtask_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    -- This function is now deprecated - use get_next_subtask_number instead
    -- Keeping for backwards compatibility but will error if called
    RAISE EXCEPTION 'generate_subtask_number() is deprecated. Use get_next_subtask_number(school_id) instead.';
END;
$$;

-- Update assign_task_number trigger function to use school-specific numbering
CREATE OR REPLACE FUNCTION public.assign_task_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.get_next_task_number(NEW.school_id);
    END IF;
    RETURN NEW;
END;
$$;

-- Update assign_subtask_number trigger function to use school-specific numbering
CREATE OR REPLACE FUNCTION public.assign_subtask_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.get_next_subtask_number(NEW.school_id);
    END IF;
    RETURN NEW;
END;
$$;

-- Phase 2: Migrate existing data to school-specific numbering

-- First, let's backup the current task numbers (optional - for rollback)
CREATE TABLE IF NOT EXISTS public.task_number_backup AS
SELECT id, task_number, school_id, created_at FROM public.tasks;

CREATE TABLE IF NOT EXISTS public.subtask_number_backup AS  
SELECT id, task_number, school_id, created_at FROM public.subtasks;

-- Renumber existing tasks per school based on creation order
WITH numbered_tasks AS (
    SELECT 
        id,
        school_id,
        ROW_NUMBER() OVER (PARTITION BY school_id ORDER BY created_at) as new_number
    FROM public.tasks
)
UPDATE public.tasks 
SET task_number = 'TSK' || LPAD(numbered_tasks.new_number::TEXT, 5, '0')
FROM numbered_tasks
WHERE tasks.id = numbered_tasks.id;

-- Renumber existing subtasks per school based on creation order
WITH numbered_subtasks AS (
    SELECT 
        id,
        school_id,
        ROW_NUMBER() OVER (PARTITION BY school_id ORDER BY created_at) as new_number
    FROM public.subtasks
)
UPDATE public.subtasks 
SET task_number = 'STSK' || LPAD(numbered_subtasks.new_number::TEXT, 5, '0')
FROM numbered_subtasks
WHERE subtasks.id = numbered_subtasks.id;

-- Phase 3: Initialize school counters to current maximums

-- Update school task_number to reflect current highest task number per school
UPDATE public.schools 
SET task_number = COALESCE(task_counts.max_count, 0)
FROM (
    SELECT 
        school_id,
        COUNT(*) as max_count
    FROM public.tasks
    GROUP BY school_id
) task_counts
WHERE schools.id = task_counts.school_id;

-- Update school subtask_number to reflect current highest subtask number per school
UPDATE public.schools 
SET subtask_number = COALESCE(subtask_counts.max_count, 0)
FROM (
    SELECT 
        school_id,
        COUNT(*) as max_count
    FROM public.subtasks
    GROUP BY school_id
) subtask_counts
WHERE schools.id = subtask_counts.school_id;

-- Initialize task_number and subtask_number to 0 for schools with no tasks/subtasks
UPDATE public.schools 
SET task_number = 0 
WHERE task_number IS NULL;

UPDATE public.schools 
SET subtask_number = 0 
WHERE subtask_number IS NULL;