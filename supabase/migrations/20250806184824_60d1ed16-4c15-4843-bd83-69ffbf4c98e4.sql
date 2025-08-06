
-- First, let's check what policies exist on the profiles table
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- Drop the legacy policies with hardcoded role arrays
DROP POLICY IF EXISTS "Instructors can manage cadet and command staff roles in their s" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can manage profiles with assignable roles" ON public.profiles;

-- Create role hierarchy helper functions
CREATE OR REPLACE FUNCTION public.can_manage_user_role(target_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_role_name text;
  target_role_admin_only boolean;
BEGIN
  -- Get current user's role
  SELECT ur.role_name INTO current_user_role_name
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
  
  -- If no role found, deny access
  IF current_user_role_name IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admins can manage any role
  IF current_user_role_name = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Get target role's admin_only flag
  SELECT admin_only INTO target_role_admin_only
  FROM public.user_roles
  WHERE role_name = target_role;
  
  -- If target role is admin_only and current user is not admin, deny
  IF target_role_admin_only = true THEN
    RETURN false;
  END IF;
  
  -- Instructors can manage non-admin-only roles
  IF current_user_role_name = 'instructor' THEN
    RETURN true;
  END IF;
  
  -- Command staff can manage cadet roles only
  IF current_user_role_name = 'command_staff' AND target_role = 'cadet' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_modify_user_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  current_user_role_name text;
  current_user_school_id uuid;
  target_user_role_name text;
  target_user_school_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Users can always modify their own profile
  IF current_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Get current user's role and school
  SELECT ur.role_name, p.school_id 
  INTO current_user_role_name, current_user_school_id
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = current_user_id;
  
  -- Get target user's role and school
  SELECT ur.role_name, p.school_id 
  INTO target_user_role_name, target_user_school_id
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = target_user_id;
  
  -- Must be in same school (unless admin)
  IF current_user_role_name != 'admin' AND current_user_school_id != target_user_school_id THEN
    RETURN false;
  END IF;
  
  -- Check if current user can manage the target user's role
  RETURN public.can_manage_user_role(target_user_role_name);
END;
$$;

-- Update the existing permission-based policy to be more comprehensive
DROP POLICY IF EXISTS "Users with profile permissions can update profiles in their sch" ON public.profiles;

CREATE POLICY "Users with profile permissions can manage profiles" 
ON public.profiles 
FOR ALL
USING (
  -- Users can view profiles in their school if they have read permission
  (current_user_has_permission('users', 'read') AND school_id = get_current_user_school_id()) OR
  -- Users can view their own profile
  (id = auth.uid())
)
WITH CHECK (
  -- Users can modify profiles if they have update permission and can manage the target role
  (current_user_has_permission('users', 'update') AND public.can_modify_user_profile(id)) OR
  -- Users can create profiles if they have create permission and can assign the role
  (current_user_has_permission('users', 'create') AND public.can_manage_user_role(role::text) AND school_id = get_current_user_school_id()) OR
  -- Users can modify their own profile
  (id = auth.uid())
);

-- Add a specific policy for profile creation to ensure proper role assignment
CREATE POLICY "Users can create profiles with appropriate roles"
ON public.profiles
FOR INSERT
WITH CHECK (
  current_user_has_permission('users', 'create') AND 
  public.can_manage_user_role(role::text) AND 
  school_id = get_current_user_school_id()
);

-- Add a specific policy for profile updates with role change validation
CREATE POLICY "Users can update profiles with role validation"
ON public.profiles
FOR UPDATE
USING (
  public.can_modify_user_profile(id)
)
WITH CHECK (
  public.can_modify_user_profile(id) AND
  -- If role is being changed, verify the new role can be assigned
  (OLD.role = NEW.role OR public.can_manage_user_role(NEW.role::text))
);
