-- Fix remaining Function Search Path Mutable warnings

-- Fix validate_incident_status function
CREATE OR REPLACE FUNCTION public.validate_incident_status(status_value text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.incident_status_options 
    WHERE value = status_value AND is_active = true
  );
END;
$$;

-- Fix validate_incident_priority function
CREATE OR REPLACE FUNCTION public.validate_incident_priority(priority_value text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.incident_priority_options 
    WHERE value = priority_value AND is_active = true
  );
END;
$$;

-- Fix validate_incident_category function
CREATE OR REPLACE FUNCTION public.validate_incident_category(category_value text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.incident_category_options 
    WHERE value = category_value AND is_active = true
  );
END;
$$;

-- Fix validate_task_status function
CREATE OR REPLACE FUNCTION public.validate_task_status(status_value text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.task_status_options 
    WHERE value = status_value AND is_active = true
  );
END;
$$;

-- Fix validate_task_priority function
CREATE OR REPLACE FUNCTION public.validate_task_priority(priority_value text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.task_priority_options 
    WHERE value = priority_value AND is_active = true
  );
END;
$$;