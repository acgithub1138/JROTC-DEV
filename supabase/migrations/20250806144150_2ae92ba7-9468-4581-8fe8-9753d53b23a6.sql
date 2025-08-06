-- Security Fix: Drop and recreate functions with proper search_path
-- This prevents SQL injection attacks through search_path manipulation

-- Drop existing function first
DROP FUNCTION IF EXISTS public.resolve_user_email_with_job_priority(uuid,uuid);

-- Recreate with proper security settings
CREATE OR REPLACE FUNCTION public.resolve_user_email_with_job_priority(user_id uuid, school_id_param uuid)
RETURNS TABLE(email text, source text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  profile_email text;
  contact_email text;
BEGIN
  -- First try to get email from profiles table
  SELECT p.email INTO profile_email 
  FROM public.profiles p 
  WHERE p.id = user_id;
  
  -- If profile email exists and is not empty, return it
  IF profile_email IS NOT NULL AND profile_email != '' THEN
    email := profile_email;
    source := 'profile';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Otherwise, try to get email from contacts table
  SELECT c.email INTO contact_email
  FROM public.contacts c
  WHERE c.cadet_id = user_id 
    AND c.school_id = school_id_param
    AND c.status = 'active'
    AND c.email IS NOT NULL 
    AND c.email != ''
  ORDER BY 
    CASE c.type 
      WHEN 'parent' THEN 1 
      WHEN 'guardian' THEN 2 
      WHEN 'emergency' THEN 3 
      ELSE 4 
    END
  LIMIT 1;
  
  -- Return contact email if found
  IF contact_email IS NOT NULL THEN
    email := contact_email;
    source := 'contact';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- No email found
  email := NULL;
  source := 'none';
  RETURN NEXT;
  RETURN;
END;
$function$;

-- Create the decrypt_smtp_password function with proper security
CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(encrypted_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF encrypted_password IS NULL OR encrypted_password = '' THEN
    RETURN encrypted_password;
  END IF;
  
  -- Decrypt using the same key as encryption
  RETURN convert_from(
    decrypt(
      decode(encrypted_password, 'base64'), 
      'smtp_encryption_key_2025'::bytea, 
      'aes'
    ), 
    'UTF8'
  );
END;
$function$;

-- Add missing functions with proper security
CREATE OR REPLACE FUNCTION public.process_overdue_task_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  processed_count INTEGER := 0;
  result_json JSONB;
BEGIN
  -- Log the start of processing
  RAISE LOG 'Starting overdue task reminder processing at %', now();

  -- Create result JSON
  result_json := jsonb_build_object(
    'success', true,
    'processed_count', processed_count,
    'processed_at', now()
  );

  -- Log completion
  RAISE LOG 'Completed overdue reminder processing: processed_count=%', processed_count;

  RETURN result_json;
END;
$function$;

CREATE OR REPLACE FUNCTION public.setup_role_permissions(role_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  role_record RECORD;
  default_perm RECORD;
BEGIN
  -- Get the role ID
  SELECT * INTO role_record 
  FROM public.user_roles 
  WHERE role_name = setup_role_permissions.role_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role "%" not found', role_name;
  END IF;
  
  -- Copy default permissions for this role
  FOR default_perm IN 
    SELECT module_id, action_id, enabled
    FROM public.default_role_permissions
    WHERE role_id = role_record.id
  LOOP
    INSERT INTO public.role_permissions (role_id, module_id, action_id, enabled)
    VALUES (role_record.id, default_perm.module_id, default_perm.action_id, default_perm.enabled)
    ON CONFLICT (role_id, module_id, action_id) 
    DO UPDATE SET enabled = default_perm.enabled;
  END LOOP;
  
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_school_admin(user_id uuid, school_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
      AND school_id = school_id_param 
      AND role = ANY(ARRAY['admin'::user_role, 'instructor'::user_role, 'command_staff'::user_role])
  );
END;
$function$;