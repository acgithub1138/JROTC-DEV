-- Fix the add_user_role function to handle enum value commits properly
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
  
  -- We need to commit the transaction here to make the enum value available
  -- This is a limitation of PostgreSQL - new enum values must be committed before use
  COMMIT;
  
  -- Start a new transaction for the permission setup
  BEGIN;
  
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
$function$;