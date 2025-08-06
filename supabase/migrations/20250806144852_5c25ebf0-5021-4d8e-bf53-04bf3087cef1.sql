-- Final batch - fix all remaining functions with search_path issues

-- Fix get_all_roles function
CREATE OR REPLACE FUNCTION public.get_all_roles()
RETURNS TABLE(role_name text, role_label text, can_be_assigned boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role_val text;
BEGIN
  -- Get current user role
  SELECT ur.role_name INTO user_role_val 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    ur.role_name::text,
    ur.role_label::text,
    CASE 
      WHEN user_role_val = 'admin' THEN true
      WHEN ur.admin_only = true THEN false
      ELSE true
    END as can_be_assigned
  FROM public.user_roles ur
  WHERE ur.is_active = true
  ORDER BY ur.sort_order;
END;
$function$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT ur.role_name 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
$function$;

-- Fix get_current_user_school_id function
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- Fix get_incident_category_values function
CREATE OR REPLACE FUNCTION public.get_incident_category_values()
RETURNS TABLE(value text, label text)
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  SELECT 
    enumlabel as value,
    INITCAP(REPLACE(enumlabel, '_', ' ')) as label
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'incident_category')
  ORDER BY enumsortorder;
$function$;

-- Fix get_incident_status_values function
CREATE OR REPLACE FUNCTION public.get_incident_status_values()
RETURNS TABLE(value text, label text)
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  SELECT 
    enumlabel as value,
    INITCAP(REPLACE(enumlabel, '_', ' ')) as label
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'incident_status')
  ORDER BY enumsortorder;
$function$;

-- Fix get_next_subtask_number function
CREATE OR REPLACE FUNCTION public.get_next_subtask_number(school_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

-- Fix get_next_task_number function
CREATE OR REPLACE FUNCTION public.get_next_task_number(school_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;

-- Fix get_table_columns function
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  SELECT 
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
$function$;

-- Fix get_user_school_id function
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- Fix increment_mapping_usage function
CREATE OR REPLACE FUNCTION public.increment_mapping_usage(mapping_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.criteria_mappings 
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE id = mapping_id;
END;
$function$;