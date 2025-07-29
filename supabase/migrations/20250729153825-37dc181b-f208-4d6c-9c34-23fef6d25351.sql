-- Drop the old conflicting get_assignable_roles function that uses enum
DROP FUNCTION IF EXISTS public.get_assignable_roles();

-- Create the correct get_assignable_roles function that uses user_roles table
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
    CASE 
      WHEN current_user_role_name = 'admin' THEN true
      WHEN ur.admin_only = true THEN false
      ELSE true
    END as can_be_assigned
  FROM public.user_roles ur
  WHERE ur.is_active = true
  ORDER BY ur.sort_order;
END;
$function$;