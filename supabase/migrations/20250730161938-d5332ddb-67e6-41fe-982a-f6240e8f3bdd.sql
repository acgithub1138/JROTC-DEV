-- Remove the deprecated role column from role_permissions table
-- This migration completes the transition to using role_id foreign keys

-- Step 1: Drop the role column from role_permissions
ALTER TABLE public.role_permissions DROP COLUMN IF EXISTS role;

-- Step 2: Update the unique constraint to use role_id instead of role
-- First drop the old constraint if it exists
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_module_id_action_id_key;

-- Add the new constraint using role_id
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_module_id_action_id_key 
  UNIQUE (role_id, module_id, action_id);

-- Step 3: Update the check_user_permission function to use role_id joins
CREATE OR REPLACE FUNCTION public.check_user_permission(user_id uuid, module_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN COALESCE(
    (
      SELECT rp.enabled
      FROM public.role_permissions rp
      JOIN public.permission_modules pm ON rp.module_id = pm.id
      JOIN public.permission_actions pa ON rp.action_id = pa.id
      JOIN public.profiles p ON p.role_id = rp.role_id
      WHERE p.id = user_id
        AND pm.name = module_name
        AND pa.name = action_name
    ),
    false
  );
END;
$function$;