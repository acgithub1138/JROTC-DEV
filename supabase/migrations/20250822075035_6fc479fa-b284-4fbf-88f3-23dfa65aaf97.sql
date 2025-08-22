-- Create a simple function to get permission modules without complex type inference issues
CREATE OR REPLACE FUNCTION get_permission_modules_simple(
  is_tab_param boolean DEFAULT NULL,
  parent_module_param uuid DEFAULT NULL,
  is_active_param boolean DEFAULT true
)
RETURNS TABLE(
  id uuid,
  name text,
  label text,
  path text,
  icon text,
  sort_order integer,
  is_tab boolean,
  parent_module uuid,
  is_competition_portal boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.name,
    pm.label,
    pm.path,
    pm.icon,
    pm.sort_order,
    pm.is_tab,
    pm.parent_module,
    pm.is_competition_portal
  FROM public.permission_modules pm
  WHERE 
    (is_tab_param IS NULL OR pm.is_tab = is_tab_param)
    AND (parent_module_param IS NULL OR pm.parent_module = parent_module_param)
    AND (is_active_param IS NULL OR pm.is_active = is_active_param)
  ORDER BY pm.sort_order, pm.name;
END;
$$;