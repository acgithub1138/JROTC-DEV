-- Fix the return type mismatch in get_all_roles and get_assignable_roles functions

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
  SELECT role::text INTO user_role_val FROM public.profiles WHERE id = auth.uid();
  
  RETURN QUERY
  SELECT 
    enumlabel::text as role_name,
    INITCAP(REPLACE(enumlabel, '_', ' '))::text as role_label,
    CASE 
      WHEN user_role_val = 'admin' THEN true
      WHEN enumlabel IN ('admin', 'instructor') THEN false
      ELSE true
    END as can_be_assigned
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ORDER BY enumsortorder;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_assignable_roles(current_user_role text DEFAULT NULL::text)
 RETURNS TABLE(role_name text, role_label text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_role_val text;
BEGIN
  -- Get current user role if not provided
  IF current_user_role IS NULL THEN
    SELECT role::text INTO user_role_val FROM public.profiles WHERE id = auth.uid();
  ELSE
    user_role_val := current_user_role;
  END IF;
  
  -- Return roles based on user permissions
  IF user_role_val = 'admin' THEN
    -- Admins can assign any role
    RETURN QUERY
    SELECT 
      enumlabel::text as role_name,
      INITCAP(REPLACE(enumlabel, '_', ' '))::text as role_label
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ORDER BY enumsortorder;
  ELSE
    -- Non-admins cannot assign admin or instructor roles
    RETURN QUERY
    SELECT 
      enumlabel::text as role_name,
      INITCAP(REPLACE(enumlabel, '_', ' '))::text as role_label
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel NOT IN ('admin', 'instructor')
    ORDER BY enumsortorder;
  END IF;
END;
$function$;