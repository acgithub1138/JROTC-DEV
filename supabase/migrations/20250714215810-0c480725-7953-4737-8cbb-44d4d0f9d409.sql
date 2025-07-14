-- Fix trigger functions to use fully qualified function names
-- This resolves the "function does not exist" error

-- Update assign_incident_number trigger function
CREATE OR REPLACE FUNCTION public.assign_incident_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF NEW.incident_number IS NULL THEN
        NEW.incident_number := public.generate_incident_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Update assign_task_number trigger function  
CREATE OR REPLACE FUNCTION public.assign_task_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.generate_task_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Update assign_subtask_number trigger function
CREATE OR REPLACE FUNCTION public.assign_subtask_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.generate_subtask_number();
    END IF;
    RETURN NEW;
END;
$$;