-- Fix the add_user_role function to handle enum values properly
-- The issue is that we can't use COMMIT/BEGIN in a function
-- Instead, we'll delay the permission creation to avoid the enum transaction issue
CREATE OR REPLACE FUNCTION public.add_user_role(
  role_name text, 
  display_label text DEFAULT NULL::text, 
  is_admin_only boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  normalized_role_name text;
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
  
  -- Note: We cannot add permissions in the same transaction as the enum value
  -- The frontend will need to call a separate function to set up permissions
  -- after the enum value is committed
  
END;
$function$;

-- Create a separate function to set up permissions for a role
CREATE OR REPLACE FUNCTION public.setup_role_permissions(role_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  normalized_role_name text;
  base_role_enum text := 'cadet';
BEGIN
  -- Normalize role name to match the enum value
  normalized_role_name := lower(regexp_replace(trim(role_name), '\s+', '_', 'g'));
  
  -- Check if role exists in enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = normalized_role_name 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    RAISE EXCEPTION 'Role "%" does not exist', normalized_role_name;
  END IF;
  
  -- Create default permissions for the new role based on cadet role
  INSERT INTO public.default_role_permissions (role, module_id, action_id, enabled)
  SELECT 
    normalized_role_name::public.user_role,
    module_id,
    action_id,
    enabled
  FROM public.default_role_permissions 
  WHERE role = base_role_enum::public.user_role
  ON CONFLICT (role, module_id, action_id) DO NOTHING;
  
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
$function$;