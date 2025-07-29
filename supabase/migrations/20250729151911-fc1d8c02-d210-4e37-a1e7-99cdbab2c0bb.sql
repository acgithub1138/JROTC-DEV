-- Create user_roles table for dynamic role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  role_label TEXT NOT NULL,
  admin_only BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table
CREATE POLICY "Everyone can view active user roles"
ON public.user_roles
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Insert existing roles from the enum into the new table
INSERT INTO public.user_roles (role_name, role_label, admin_only, sort_order) VALUES
('admin', 'Administrator', true, 1),
('instructor', 'Instructor', true, 2),
('command_staff', 'Command Staff', false, 3),
('cadet', 'Cadet', false, 4),
('parent', 'Parent', false, 5),
('special_staff', 'Special Staff', false, 6);

-- Add role_id column to profiles table (nullable for migration)
ALTER TABLE public.profiles ADD COLUMN role_id UUID REFERENCES public.user_roles(id);

-- Populate role_id based on existing role enum values
UPDATE public.profiles 
SET role_id = (
  SELECT id FROM public.user_roles 
  WHERE role_name = profiles.role::text
);

-- Add role_id column to role_permissions table (nullable for migration)
ALTER TABLE public.role_permissions ADD COLUMN role_id UUID REFERENCES public.user_roles(id);

-- Populate role_id in role_permissions based on existing role enum values
UPDATE public.role_permissions 
SET role_id = (
  SELECT id FROM public.user_roles 
  WHERE role_name = role_permissions.role::text
);

-- Add role_id column to default_role_permissions table (nullable for migration)
ALTER TABLE public.default_role_permissions ADD COLUMN role_id UUID REFERENCES public.user_roles(id);

-- Populate role_id in default_role_permissions based on existing role enum values
UPDATE public.default_role_permissions 
SET role_id = (
  SELECT id FROM public.user_roles 
  WHERE role_name = default_role_permissions.role::text
);

-- Create updated functions that use the new user_roles table
CREATE OR REPLACE FUNCTION public.get_all_roles()
RETURNS TABLE(role_name text, role_label text, can_be_assigned boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role_val text;
BEGIN
  -- Get current user role
  SELECT ur.role_name INTO user_role_val 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    ur.role_name::text,
    ur.role_label::text,
    CASE 
      WHEN user_role_val = 'admin' THEN true
      WHEN ur.admin_only = true THEN false
      ELSE true
    END as can_be_assigned
  FROM public.user_roles ur
  WHERE ur.is_active = true
  ORDER BY ur.sort_order;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_assignable_roles()
RETURNS TABLE(role_name text, role_label text, can_be_assigned boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_role_val text;
BEGIN
  -- Get current user role
  SELECT ur.role_name INTO user_role_val 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
  
  RETURN QUERY
  SELECT 
    ur.role_name::text,
    ur.role_label::text,
    true as can_be_assigned
  FROM public.user_roles ur
  WHERE ur.is_active = true
    AND (
      user_role_val = 'admin' OR 
      ur.admin_only = false
    )
  ORDER BY ur.sort_order;
END;
$function$;

-- Update get_current_user_role to use the new table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT ur.role_name 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();
$function$;

-- Update validate_role_transition to use the new table structure
CREATE OR REPLACE FUNCTION public.validate_role_transition(user_id uuid, old_role_id uuid, new_role_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_user_role_name text;
  new_role_admin_only boolean;
  old_role_name text;
  new_role_name text;
BEGIN
  -- Get current user's role name
  SELECT ur.role_name INTO current_user_role_name
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();

  -- Get the new role's admin_only status and role names
  SELECT ur.admin_only, ur.role_name INTO new_role_admin_only, new_role_name
  FROM public.user_roles ur
  WHERE ur.id = new_role_id;

  SELECT ur.role_name INTO old_role_name
  FROM public.user_roles ur
  WHERE ur.id = old_role_id;

  -- Log the role change attempt
  INSERT INTO public.profile_history (
    profile_id, field_name, old_value, new_value, changed_by, school_id
  ) VALUES (
    user_id, 'role_change_attempt', old_role_name, new_role_name, auth.uid(),
    (SELECT school_id FROM public.profiles WHERE id = user_id)
  );
  
  -- Admins can change any role
  IF current_user_role_name = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Non-admins can only assign roles where admin_only = false
  IF new_role_admin_only = false THEN
    RETURN true;
  END IF;
  
  -- Otherwise, deny the change
  RETURN false;
END;
$function$;

-- Create function to add new roles dynamically
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
  IF get_current_user_role() != 'admin' THEN
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

-- Update trigger function for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();