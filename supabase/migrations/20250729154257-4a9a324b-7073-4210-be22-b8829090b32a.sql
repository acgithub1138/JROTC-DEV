-- Update the get_assignable_roles function to only return assignable roles
CREATE OR REPLACE FUNCTION public.get_assignable_roles()
RETURNS TABLE(role_name text, role_label text, can_be_assigned boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_role_name text;
BEGIN
  -- Get current user's role name from user_roles table
  SELECT ur.role_name INTO current_user_role_name 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    ur.role_name::text,
    ur.role_label::text,
    true as can_be_assigned
  FROM public.user_roles ur
  WHERE ur.is_active = true
    AND (
      -- Admins can assign any role
      current_user_role_name = 'admin' OR
      -- Non-admins can only assign roles where admin_only = false
      ur.admin_only = false
    )
  ORDER BY ur.sort_order;
END;
$function$;