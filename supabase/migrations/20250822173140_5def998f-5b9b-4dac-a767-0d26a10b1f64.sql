-- Fix the validate_profile_role_change function to handle service role operations
CREATE OR REPLACE FUNCTION public.validate_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_role_name text;
  target_role_admin_only boolean;
  current_role_name text;
BEGIN
  -- If auth.uid() is NULL (service role operation), allow the change
  -- This happens when edge functions use the service role key
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get current user's role name from the current user's role column (fallback to role_id lookup)
  SELECT COALESCE(p.role::text, ur.role_name) INTO current_user_role_name 
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
  
  -- If user is admin, allow any role change
  IF current_user_role_name = 'admin' THEN
    RETURN NEW;
  END IF;
  
  -- Check if the target role is admin_only
  SELECT ur.admin_only INTO target_role_admin_only
  FROM public.user_roles ur
  WHERE ur.id = NEW.role_id;
  
  -- If target role is admin_only and user is not admin, reject
  IF target_role_admin_only = true THEN
    RAISE EXCEPTION 'Only admins can assign admin-only roles';
  END IF;
  
  RETURN NEW;
END;
$function$;