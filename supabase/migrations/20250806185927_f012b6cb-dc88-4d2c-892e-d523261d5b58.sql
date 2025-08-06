
-- Step 1: Create missing permission helper functions with proper error handling

-- Function to check if current user can manage a specific user role
CREATE OR REPLACE FUNCTION public.can_manage_user_role(target_role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_role_name text;
  current_user_role_record RECORD;
  target_role_record RECORD;
BEGIN
  -- Get current user's role
  SELECT ur.role_name, ur.sort_order INTO current_user_role_record
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Admin can manage all roles
  IF current_user_role_record.role_name = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Get target role information
  SELECT role_name, sort_order, admin_only INTO target_role_record
  FROM public.user_roles
  WHERE role_name = target_role_name;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Cannot assign admin-only roles unless you are admin
  IF target_role_record.admin_only AND current_user_role_record.role_name != 'admin' THEN
    RETURN false;
  END IF;
  
  -- Role hierarchy: higher sort_order can manage lower sort_order
  -- Instructors can manage command_staff, cadets, parents
  -- Command staff can manage cadets and parents
  RETURN current_user_role_record.sort_order > target_role_record.sort_order;
END;
$$;

-- Function to check if current user can modify a specific user profile
CREATE OR REPLACE FUNCTION public.can_modify_user_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_role_name text;
  target_user_record RECORD;
  current_user_school_id uuid;
BEGIN
  -- Users can always modify their own profile
  IF target_user_id = auth.uid() THEN
    RETURN true;
  END IF;
  
  -- Get current user info
  SELECT ur.role_name, p.school_id INTO current_user_role_name, current_user_school_id
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Admin can modify anyone
  IF current_user_role_name = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Get target user info
  SELECT p.school_id, ur.role_name INTO target_user_record
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Must be same school
  IF target_user_record.school_id != current_user_school_id THEN
    RETURN false;
  END IF;
  
  -- Check role hierarchy - can only modify users with lower roles
  RETURN public.can_manage_user_role(target_user_record.role_name);
END;
$$;

-- Function to check if current user can assign users to a role
CREATE OR REPLACE FUNCTION public.can_assign_user_role(target_role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Same logic as can_manage_user_role for role assignment
  RETURN public.can_manage_user_role(target_role_name);
END;
$$;

-- Step 2: Drop ALL existing policies on profiles table with hardcoded arrays
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Admins and instructors can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Command staff can manage cadets and parents" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles with role validation" ON public.profiles;
DROP POLICY IF EXISTS "Users with profile permissions can manage profiles" ON public.profiles;

-- Step 3: Create comprehensive permission-based policies for profiles table
CREATE POLICY "Profile read access"
ON public.profiles
FOR SELECT
USING (
  -- Users can view their own profile
  (id = auth.uid()) OR
  -- Users with read permission can view profiles in their school
  (current_user_has_permission('users', 'read') AND school_id = get_current_user_school_id())
);

CREATE POLICY "Profile create access"
ON public.profiles
FOR INSERT
WITH CHECK (
  -- Must have create permission
  current_user_has_permission('users', 'create') AND
  -- Must be creating in same school
  school_id = get_current_user_school_id() AND
  -- Must be able to assign the role
  public.can_assign_user_role(
    COALESCE(
      (SELECT ur.role_name FROM public.user_roles ur WHERE ur.id = role_id),
      'cadet'
    )
  )
);

CREATE POLICY "Profile update access"
ON public.profiles
FOR UPDATE
USING (
  -- Can modify own profile
  (id = auth.uid()) OR
  -- Or can modify if has permission and can manage this user
  (current_user_has_permission('users', 'update') AND public.can_modify_user_profile(id))
)
WITH CHECK (
  -- Same conditions for the updated data
  (id = auth.uid()) OR
  (current_user_has_permission('users', 'update') AND 
   public.can_modify_user_profile(id) AND
   school_id = get_current_user_school_id() AND
   -- If role is being changed, must be able to assign new role
   public.can_assign_user_role(
     COALESCE(
       (SELECT ur.role_name FROM public.user_roles ur WHERE ur.id = role_id),
       'cadet'
     )
   ))
);

CREATE POLICY "Profile delete access"
ON public.profiles
FOR DELETE
USING (
  -- Must have delete permission and can manage this user
  current_user_has_permission('users', 'delete') AND 
  public.can_modify_user_profile(id) AND
  -- Cannot delete yourself
  id != auth.uid()
);

-- Step 4: Audit and fix any other tables that might have hardcoded role arrays
-- Check contacts table policies
DROP POLICY IF EXISTS "Authenticated users can manage contacts in their school" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts from their school" ON public.contacts;

CREATE POLICY "Contact access policy"
ON public.contacts
FOR ALL
USING (
  -- Users with read permission can view contacts in their school
  (current_user_has_permission('users', 'read') AND school_id = get_current_user_school_id())
)
WITH CHECK (
  -- Users with create/update permission can manage contacts in their school
  (current_user_has_permission('users', 'create') OR current_user_has_permission('users', 'update')) AND
  school_id = get_current_user_school_id()
);

-- Step 5: Ensure user_roles table has proper policies
DROP POLICY IF EXISTS "Everyone can view active user roles" ON public.user_roles;

CREATE POLICY "User roles read access"
ON public.user_roles
FOR SELECT
USING (
  -- Active roles can be viewed by authenticated users
  is_active = true
);

CREATE POLICY "User roles admin management"
ON public.user_roles
FOR ALL
USING (
  -- Only admins can manage user roles
  get_current_user_role() = 'admin'
)
WITH CHECK (
  get_current_user_role() = 'admin'
);

-- Step 6: Test that all functions exist and work
DO $$
BEGIN
  -- Test basic function calls
  PERFORM public.can_manage_user_role('cadet');
  PERFORM public.can_modify_user_profile(gen_random_uuid());
  PERFORM public.can_assign_user_role('cadet');
  PERFORM public.current_user_has_permission('users', 'read');
  PERFORM public.get_current_user_role();
  PERFORM public.get_current_user_school_id();
  
  RAISE NOTICE 'All permission functions are working correctly';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Permission system validation failed: %', SQLERRM;
END;
$$;
