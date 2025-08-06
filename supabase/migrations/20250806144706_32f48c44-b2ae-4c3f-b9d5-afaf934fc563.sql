-- Complete fix for all remaining functions missing SET search_path TO ''
-- This will secure all database functions against SQL injection attacks

-- Fix assign_incident_number trigger function
CREATE OR REPLACE FUNCTION public.assign_incident_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
    IF NEW.incident_number IS NULL THEN
        NEW.incident_number := public.generate_incident_number();
    END IF;
    RETURN NEW;
END;
$function$;

-- Fix assign_random_school_color trigger function  
CREATE OR REPLACE FUNCTION public.assign_random_school_color()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  colors text[] := ARRAY[
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', 
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#78716C'
  ];
  random_color text;
BEGIN
  -- Select a random color from the array
  random_color := colors[floor(random() * array_length(colors, 1) + 1)];
  NEW.color := random_color;
  
  RETURN NEW;
END;
$function$;

-- Fix assign_subtask_number_modern trigger function
CREATE OR REPLACE FUNCTION public.assign_subtask_number_modern()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.get_next_subtask_number(NEW.school_id);
    END IF;
    RETURN NEW;
END;
$function$;

-- Fix assign_task_number_modern trigger function
CREATE OR REPLACE FUNCTION public.assign_task_number_modern()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.get_next_task_number(NEW.school_id);
    END IF;
    RETURN NEW;
END;
$function$;

-- Fix check_user_permission function
CREATE OR REPLACE FUNCTION public.check_user_permission(user_id uuid, module_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN COALESCE(
    (
      SELECT rp.enabled
      FROM public.role_permissions rp
      JOIN public.permission_modules pm ON rp.module_id = pm.id
      JOIN public.permission_actions pa ON rp.action_id = pa.id
      JOIN public.profiles p ON p.role_id = rp.role_id
      WHERE p.id = user_id
        AND pm.name = module_name
        AND pa.name = action_name
    ),
    false
  );
END;
$function$;