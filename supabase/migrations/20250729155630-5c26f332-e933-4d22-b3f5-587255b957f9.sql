-- Update the validate_profile_role_change trigger function to use user_roles table
CREATE OR REPLACE FUNCTION public.validate_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_role_name text;
  target_role_admin_only boolean;
BEGIN
  -- Get current user's role name
  SELECT ur.role_name INTO current_user_role_name 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
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

-- Update RLS policy on profiles table to allow instructors to manage any non-admin-only role
DROP POLICY IF EXISTS "Instructors can manage cadet and command staff profiles" ON public.profiles;

CREATE POLICY "Instructors can manage profiles with assignable roles" 
ON public.profiles 
FOR UPDATE 
USING (
  school_id = get_current_user_school_id() 
  AND (
    get_current_user_role() = 'admin' 
    OR (
      get_current_user_role() = ANY (ARRAY['instructor', 'command_staff']) 
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.id = profiles.role_id 
        AND (ur.admin_only = false OR get_current_user_role() = 'admin')
      )
    )
  )
);