-- Update the get_assignable_roles function to restrict Administrator role to specific email
CREATE OR REPLACE FUNCTION public.get_assignable_roles()
RETURNS TABLE(role_name text, role_label text, can_be_assigned boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_role_name text;
  current_user_email text;
BEGIN
  -- Get current user's role name and email
  SELECT ur.role_name, p.email 
  INTO current_user_role_name, current_user_email
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
      -- Special case: Administrator role only for admin@careyunlimited.com
      (ur.role_name = 'admin' AND current_user_email = 'admin@careyunlimited.com') OR
      -- All other admin roles for admins
      (ur.role_name != 'admin' AND current_user_role_name = 'admin') OR
      -- Non-admins can only assign roles where admin_only = false
      (current_user_role_name != 'admin' AND ur.admin_only = false)
    )
  ORDER BY ur.sort_order;
END;
$function$;