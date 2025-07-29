-- Fix search_path security warnings for the functions I just created

-- Update add_user_role_to_table function
CREATE OR REPLACE FUNCTION public.add_user_role_to_table(
  role_name_param text, 
  role_label_param text DEFAULT NULL, 
  admin_only_param boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  normalized_role_name text;
  display_label text;
  new_role_id uuid;
  max_sort_order integer;
BEGIN
  -- Only admins can add roles
  IF public.get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can add new roles';
  END IF;

  -- Normalize role name to snake_case and lowercase
  normalized_role_name := lower(regexp_replace(trim(role_name_param), '\s+', '_', 'g'));
  
  -- Validate role name
  IF normalized_role_name = '' OR normalized_role_name IS NULL THEN
    RAISE EXCEPTION 'Role name cannot be empty';
  END IF;
  
  -- Check if role already exists
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role_name = normalized_role_name) THEN
    RAISE EXCEPTION 'Role "%" already exists', normalized_role_name;
  END IF;
  
  -- Generate display label if not provided
  display_label := COALESCE(
    role_label_param,
    INITCAP(REPLACE(normalized_role_name, '_', ' '))
  );

  -- Get next sort order
  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO max_sort_order
  FROM public.user_roles;
  
  -- Insert new role
  INSERT INTO public.user_roles (role_name, role_label, admin_only, sort_order)
  VALUES (normalized_role_name, display_label, admin_only_param, max_sort_order)
  RETURNING id INTO new_role_id;
  
  RETURN new_role_id;
END;
$function$;