-- Update the handle_new_user function to work with text roles (removing enum casting)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  role_uuid uuid;
  school_record RECORD;
  template_record RECORD;
  queue_item_id UUID;
  flattened_data JSONB;
BEGIN
  -- Look up the role_id if role is provided in metadata
  IF NEW.raw_user_meta_data ->> 'role_id' IS NOT NULL THEN
    -- Use the role_id directly if provided
    role_uuid := (NEW.raw_user_meta_data ->> 'role_id')::uuid;
  ELSIF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    -- Look up role_id based on role name
    SELECT id INTO role_uuid 
    FROM public.user_roles 
    WHERE role_name = (NEW.raw_user_meta_data ->> 'role');
  ELSE
    -- Default to cadet role
    SELECT id INTO role_uuid 
    FROM public.user_roles 
    WHERE role_name = 'cadet';
  END IF;

  -- Insert the profile with text-based role (no enum casting)
  INSERT INTO public.profiles (id, school_id, first_name, last_name, email, role, role_id)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'school_id')::uuid,
      (SELECT id FROM public.schools LIMIT 1)
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'cadet'),
    role_uuid
  );

  -- Get school information for the welcome email
  SELECT * INTO school_record
  FROM public.schools 
  WHERE id = COALESCE(
    (NEW.raw_user_meta_data ->> 'school_id')::uuid,
    (SELECT id FROM public.schools LIMIT 1)
  );

  -- Get the welcome email template
  SELECT * INTO template_record
  FROM public.email_templates 
  WHERE name = 'Welcome New User' AND is_active = true AND is_global = true
  LIMIT 1;

  -- Queue the welcome email if template exists
  IF template_record.id IS NOT NULL AND school_record.id IS NOT NULL THEN
    -- Create flattened data for email template processing
    flattened_data := jsonb_build_object(
      'first_name', COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown'),
      'last_name', COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
      'email', NEW.email,
      'school_name', school_record.name
    );

    -- Process template variables and queue email directly
    INSERT INTO public.email_queue (
      template_id,
      recipient_email,
      subject,
      body,
      school_id,
      source_table,
      record_id,
      scheduled_at
    ) VALUES (
      template_record.id,
      NEW.email,
      public.replace_template_variables(template_record.subject, flattened_data),
      public.replace_template_variables(template_record.body, flattened_data),
      school_record.id,
      'profiles',
      NEW.id,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Remove the role enum column from default_role_permissions if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'default_role_permissions' 
             AND column_name = 'role') THEN
    ALTER TABLE public.default_role_permissions DROP COLUMN role;
  END IF;
END $$;

-- Drop the add_user_role function
DROP FUNCTION IF EXISTS public.add_user_role(text, text, boolean);

-- Update can_update_profile_role function to use admin_only flag instead of hardcoded checks
CREATE OR REPLACE FUNCTION public.can_update_profile_role(target_profile_id uuid, new_role_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_role_name text;
  actor_school_id uuid;
  target_school_id uuid;
  new_role_name text;
  new_role_admin_only boolean;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Resolve actor role name and school
  SELECT COALESCE(ur.role_name::text, p.role::text) AS role_name, p.school_id
  INTO actor_role_name, actor_school_id
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();

  IF actor_role_name IS NULL THEN
    RETURN false;
  END IF;

  -- Derive the target new role name and admin_only flag from either role_id or text role
  IF new_role_id IS NOT NULL THEN
    SELECT ur2.role_name::text, ur2.admin_only INTO new_role_name, new_role_admin_only
    FROM public.user_roles ur2
    WHERE ur2.id = new_role_id;
  ELSE
    -- For text roles, look up in user_roles table
    SELECT ur3.role_name::text, ur3.admin_only INTO new_role_name, new_role_admin_only
    FROM public.user_roles ur3
    WHERE ur3.role_name = new_role;
    
    -- If not found in user_roles table, use the text value directly
    IF new_role_name IS NULL THEN
      new_role_name := new_role;
      new_role_admin_only := false; -- Default to false for unknown roles
    END IF;
  END IF;

  -- If role is not being changed (NULL new value), allow
  IF new_role_name IS NULL THEN
    RETURN true;
  END IF;

  -- Admins can assign any role (including Admin/Instructor and admin_only roles)
  IF actor_role_name = 'admin' THEN
    RETURN true;
  END IF;

  -- Instructors cannot assign admin_only roles
  IF actor_role_name = 'instructor' THEN
    IF new_role_admin_only = true THEN
      RETURN false;
    END IF;

    -- Must be same school
    SELECT p.school_id INTO target_school_id
    FROM public.profiles p
    WHERE p.id = target_profile_id;

    IF target_school_id IS NULL OR actor_school_id IS NULL THEN
      RETURN false;
    END IF;

    RETURN target_school_id = actor_school_id;
  END IF;

  -- All other roles cannot change user roles
  RETURN false;
END;
$$;

-- Update get_all_roles function to remove enum references
CREATE OR REPLACE FUNCTION public.get_all_roles()
RETURNS TABLE(role_name text, role_label text, can_be_assigned boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role_val text;
BEGIN
  -- Get current user role
  SELECT ur.role_name INTO user_role_val 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();

  -- If no role found, return empty
  IF user_role_val IS NULL THEN
    RETURN;
  END IF;

  -- Return roles based on permissions
  RETURN QUERY
  SELECT 
    ur.role_name::text,
    ur.role_label::text,
    CASE 
      WHEN user_role_val = 'admin' THEN true
      WHEN user_role_val = 'instructor' AND ur.admin_only = false THEN true
      ELSE false
    END as can_be_assigned
  FROM public.user_roles ur
  WHERE ur.is_active = true
  ORDER BY ur.sort_order;
END;
$$;

-- Update get_assignable_roles function to remove enum references
CREATE OR REPLACE FUNCTION public.get_assignable_roles()
RETURNS TABLE(role_name text, role_label text, can_be_assigned boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role_val text;
BEGIN
  -- Get current user role
  SELECT ur.role_name INTO user_role_val 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = auth.uid();

  -- If no role found, return empty
  IF user_role_val IS NULL THEN
    RETURN;
  END IF;

  -- Return only assignable roles
  RETURN QUERY
  SELECT 
    ur.role_name::text,
    ur.role_label::text,
    true as can_be_assigned
  FROM public.user_roles ur
  WHERE ur.is_active = true
    AND (
      user_role_val = 'admin' OR 
      (user_role_val = 'instructor' AND ur.admin_only = false)
    )
  ORDER BY ur.sort_order;
END;
$$;

-- Finally, drop the user_role enum type
DROP TYPE IF EXISTS public.user_role CASCADE;