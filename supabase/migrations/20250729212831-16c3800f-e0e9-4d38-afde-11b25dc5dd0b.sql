-- Fix all database functions to use secure search_path

-- Update get_user_school_id function
CREATE OR REPLACE FUNCTION public.get_user_school_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- Update handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, school_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'school_id')::uuid,
      (SELECT id FROM public.schools LIMIT 1)
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'cadet')
  );
  RETURN NEW;
END;
$function$;

-- Update get_table_columns function
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
 RETURNS TABLE(column_name text, data_type text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT 
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
$function$;

-- Update get_next_task_number function
CREATE OR REPLACE FUNCTION public.get_next_task_number(school_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    next_num INTEGER;
BEGIN
    -- Atomically increment and get the next task number for the school
    UPDATE public.schools 
    SET task_number = task_number + 1
    WHERE id = school_uuid
    RETURNING task_number INTO next_num;
    
    -- If school not found, return error
    IF next_num IS NULL THEN
        RAISE EXCEPTION 'School with ID % not found', school_uuid;
    END IF;
    
    RETURN 'TSK' || LPAD(next_num::TEXT, 5, '0');
END;
$function$;

-- Update handle_graduate_status function
CREATE OR REPLACE FUNCTION public.handle_graduate_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if grade changed to 'Graduate'
  IF OLD.grade IS DISTINCT FROM NEW.grade AND NEW.grade = 'Graduate' THEN
    -- Set active to false and flight to null for graduates
    NEW.active := false;
    NEW.flight := null;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Update retry_stuck_emails function
CREATE OR REPLACE FUNCTION public.retry_stuck_emails(max_age_minutes integer DEFAULT 10)
 RETURNS TABLE(email_id uuid, school_id uuid, retry_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update stuck emails to retry
  UPDATE public.email_queue
  SET 
    status = 'pending',
    retry_count = retry_count + 1,
    next_retry_at = now() + (INTERVAL '5 minutes' * retry_count),
    last_attempt_at = now(),
    error_message = COALESCE(error_message, '') || ' | Retried at ' || now()::text,
    updated_at = now()
  WHERE status = 'pending'
    AND created_at < (now() - (max_age_minutes || ' minutes')::INTERVAL)
    AND retry_count < max_retries
    AND (next_retry_at IS NULL OR next_retry_at <= now());

  -- Return the retried emails
  RETURN QUERY 
  SELECT eq.id, eq.school_id, eq.retry_count
  FROM public.email_queue eq
  WHERE eq.last_attempt_at >= (now() - INTERVAL '1 minute')
    AND eq.retry_count > 0;
END;
$function$;

-- Update add_user_role function
CREATE OR REPLACE FUNCTION public.add_user_role(role_name text, display_label text DEFAULT NULL::text, is_admin_only boolean DEFAULT false)
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

-- Update assign_task_number_modern function
CREATE OR REPLACE FUNCTION public.assign_task_number_modern()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.get_next_task_number(NEW.school_id);
    END IF;
    RETURN NEW;
END;
$function$;

-- Update assign_incident_number function
CREATE OR REPLACE FUNCTION public.assign_incident_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF NEW.incident_number IS NULL THEN
        NEW.incident_number := public.generate_incident_number();
    END IF;
    RETURN NEW;
END;
$function$;

-- Update assign_subtask_number_modern function
CREATE OR REPLACE FUNCTION public.assign_subtask_number_modern()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := public.get_next_subtask_number(NEW.school_id);
    END IF;
    RETURN NEW;
END;
$function$;

-- Update check_user_permission function
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
      JOIN public.profiles p ON p.role = rp.role
      WHERE p.id = user_id
        AND pm.name = module_name
        AND pa.name = action_name
    ),
    false
  );
END;
$function$;

-- Update encrypt_smtp_password function
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(password_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF password_text IS NULL OR password_text = '' THEN
    RETURN password_text;
  END IF;
  
  -- Use a combination of the password and a salt for encryption
  -- In production, you should use a more secure key management approach
  RETURN encode(
    encrypt(
      password_text::bytea, 
      'smtp_encryption_key_2025'::bytea, 
      'aes'
    ), 
    'base64'
  );
END;
$function$;

-- Update get_all_roles function
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

-- Update generate_incident_number function
CREATE OR REPLACE FUNCTION public.generate_incident_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('public.incident_number_seq') INTO next_num;
    RETURN 'INC' || LPAD(next_num::TEXT, 5, '0');
END;$function$;

-- Update encrypt_smtp_password_trigger function
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only encrypt if the password appears to be unencrypted
  -- (simple check: if it doesn't look like base64, encrypt it)
  IF NEW.smtp_password IS NOT NULL 
     AND NEW.smtp_password != OLD.smtp_password 
     AND NEW.smtp_password !~ '^[A-Za-z0-9+/]*={0,2}$' THEN
    NEW.smtp_password := encrypt_smtp_password(NEW.smtp_password);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update decrypt_smtp_password function
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
  
  RETURN convert_from(
    decrypt(
      decode(encrypted_password, 'base64'),
      'smtp_encryption_key_2025'::bytea,
      'aes'
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return the original value (for backward compatibility)
    RETURN encrypted_password;
END;
$function$;

-- Update get_incident_status_values function
CREATE OR REPLACE FUNCTION public.get_incident_status_values()
 RETURNS TABLE(value text, label text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT 
    enumlabel as value,
    INITCAP(REPLACE(enumlabel, '_', ' ')) as label
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'incident_status')
  ORDER BY enumsortorder;
$function$;

-- Update get_next_subtask_number function
CREATE OR REPLACE FUNCTION public.get_next_subtask_number(school_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    next_num INTEGER;
BEGIN
    -- Atomically increment and get the next subtask number for the school
    UPDATE public.schools 
    SET subtask_number = subtask_number + 1
    WHERE id = school_uuid
    RETURNING subtask_number INTO next_num;
    
    -- If school not found, return error
    IF next_num IS NULL THEN
        RAISE EXCEPTION 'School with ID % not found', school_uuid;
    END IF;
    
    RETURN 'STSK' || LPAD(next_num::TEXT, 5, '0');
END;
$function$;

-- Update get_current_user_role function
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

-- Update get_current_user_school_id function
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- Update get_incident_category_values function
CREATE OR REPLACE FUNCTION public.get_incident_category_values()
 RETURNS TABLE(value text, label text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT 
    enumlabel as value,
    INITCAP(REPLACE(enumlabel, '_', ' ')) as label
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'incident_category')
  ORDER BY enumsortorder;
$function$;