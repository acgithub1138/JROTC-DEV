-- Create function to add new user roles to the enum
CREATE OR REPLACE FUNCTION add_user_role(role_name text, display_label text DEFAULT NULL, is_admin_only boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  normalized_role_name text;
  base_role_enum text := 'cadet';
BEGIN
  -- Normalize role name to snake_case and lowercase
  normalized_role_name := lower(regexp_replace(trim(role_name), '\s+', '_', 'g'));
  
  -- Validate role name
  IF normalized_role_name = '' OR normalized_role_name IS NULL THEN
    RAISE EXCEPTION 'Role name cannot be empty';
  END IF;
  
  -- Check if role already exists
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = normalized_role_name 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    RAISE EXCEPTION 'Role "%" already exists', normalized_role_name;
  END IF;
  
  -- Add new value to user_role enum
  EXECUTE format('ALTER TYPE public.user_role ADD VALUE %L', normalized_role_name);
  
  -- Create default permissions for the new role based on cadet role
  INSERT INTO public.default_role_permissions (role, module_id, action_id, enabled)
  SELECT 
    normalized_role_name::public.user_role,
    module_id,
    action_id,
    enabled
  FROM public.default_role_permissions 
  WHERE role = base_role_enum::public.user_role;
  
  -- Create actual permissions for the new role based on cadet role
  INSERT INTO public.role_permissions (role, module_id, action_id, enabled)
  SELECT 
    normalized_role_name::public.user_role,
    module_id,
    action_id,
    enabled
  FROM public.role_permissions 
  WHERE role = base_role_enum::public.user_role
  ON CONFLICT (role, module_id, action_id) DO NOTHING;
  
END;
$$;

-- Create function to get available roles for assignment based on current user role
CREATE OR REPLACE FUNCTION get_assignable_roles(current_user_role text DEFAULT NULL)
RETURNS TABLE(role_name text, role_label text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
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
      enumlabel as role_name,
      INITCAP(REPLACE(enumlabel, '_', ' ')) as role_label
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ORDER BY enumsortorder;
  ELSE
    -- Non-admins cannot assign admin or instructor roles
    RETURN QUERY
    SELECT 
      enumlabel as role_name,
      INITCAP(REPLACE(enumlabel, '_', ' ')) as role_label
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    AND enumlabel NOT IN ('admin', 'instructor')
    ORDER BY enumsortorder;
  END IF;
END;
$$;

-- Create function to get all available roles
CREATE OR REPLACE FUNCTION get_all_roles()
RETURNS TABLE(role_name text, role_label text, can_be_assigned boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role_val text;
BEGIN
  -- Get current user role
  SELECT role::text INTO user_role_val FROM public.profiles WHERE id = auth.uid();
  
  RETURN QUERY
  SELECT 
    enumlabel as role_name,
    INITCAP(REPLACE(enumlabel, '_', ' ')) as role_label,
    CASE 
      WHEN user_role_val = 'admin' THEN true
      WHEN enumlabel IN ('admin', 'instructor') THEN false
      ELSE true
    END as can_be_assigned
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ORDER BY enumsortorder;
END;
$$;