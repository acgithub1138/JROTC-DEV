-- Security Fix: Drop all existing functions and recreate with proper search_path
-- This prevents SQL injection attacks through search_path manipulation

-- Drop all existing functions that need security fixes
DROP FUNCTION IF EXISTS public.process_overdue_task_reminders();
DROP FUNCTION IF EXISTS public.setup_role_permissions(text);
DROP FUNCTION IF EXISTS public.is_school_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.decrypt_smtp_password(text);

-- Recreate all functions with proper SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.process_overdue_task_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  processed_count INTEGER := 0;
  task_record RECORD;
  subtask_record RECORD;
  template_record RECORD;
  recipient_email_result RECORD;
  queue_item_id UUID;
  result_json JSONB;
BEGIN
  -- Log the start of processing
  RAISE LOG 'Starting overdue task reminder processing at %', now();

  -- Process overdue tasks
  FOR task_record IN 
    SELECT t.id, t.task_number, t.title, t.description, t.due_date, t.assigned_to, t.school_id
    FROM public.tasks t
    WHERE t.due_date < CURRENT_DATE
      AND t.status != 'completed'
      AND t.assigned_to IS NOT NULL
      AND (t.last_reminder_sent IS NULL OR t.last_reminder_sent < CURRENT_DATE - INTERVAL '1 day')
  LOOP
    -- Find active task overdue template for this school
    SELECT * INTO template_record
    FROM public.email_templates et
    WHERE et.school_id = task_record.school_id
      AND et.source_table = 'tasks'
      AND et.name ILIKE '%overdue%'
      AND et.is_active = true
    LIMIT 1;
    
    IF template_record.id IS NOT NULL THEN
      -- Get recipient email
      SELECT email, source INTO recipient_email_result
      FROM public.resolve_user_email_with_job_priority(task_record.assigned_to, task_record.school_id);
      
      IF recipient_email_result.email IS NOT NULL THEN
        -- Queue the reminder email
        SELECT public.queue_email(
          template_record.id,
          recipient_email_result.email,
          'tasks',
          task_record.id,
          task_record.school_id
        ) INTO queue_item_id;
        
        -- Update last reminder sent
        UPDATE public.tasks 
        SET last_reminder_sent = CURRENT_DATE,
            updated_at = now()
        WHERE id = task_record.id;
        
        processed_count := processed_count + 1;
        
        RAISE LOG 'Queued overdue task reminder: task_id=%, queue_id=%', task_record.id, queue_item_id;
      END IF;
    END IF;
  END LOOP;

  -- Process overdue subtasks
  FOR subtask_record IN 
    SELECT st.id, st.task_number, st.title, st.description, st.due_date, st.assigned_to, st.school_id
    FROM public.subtasks st
    WHERE st.due_date < CURRENT_DATE
      AND st.status != 'completed'
      AND st.assigned_to IS NOT NULL
      AND (st.last_reminder_sent IS NULL OR st.last_reminder_sent < CURRENT_DATE - INTERVAL '1 day')
  LOOP
    -- Find active subtask overdue template for this school
    SELECT * INTO template_record
    FROM public.email_templates et
    WHERE et.school_id = subtask_record.school_id
      AND et.source_table = 'subtasks'
      AND et.name ILIKE '%overdue%'
      AND et.is_active = true
    LIMIT 1;
    
    IF template_record.id IS NOT NULL THEN
      -- Get recipient email
      SELECT email, source INTO recipient_email_result
      FROM public.resolve_user_email_with_job_priority(subtask_record.assigned_to, subtask_record.school_id);
      
      IF recipient_email_result.email IS NOT NULL THEN
        -- Queue the reminder email
        SELECT public.queue_email(
          template_record.id,
          recipient_email_result.email,
          'subtasks',
          subtask_record.id,
          subtask_record.school_id
        ) INTO queue_item_id;
        
        -- Update last reminder sent
        UPDATE public.subtasks 
        SET last_reminder_sent = CURRENT_DATE,
            updated_at = now()
        WHERE id = subtask_record.id;
        
        processed_count := processed_count + 1;
        
        RAISE LOG 'Queued overdue subtask reminder: subtask_id=%, queue_id=%', subtask_record.id, queue_item_id;
      END IF;
    END IF;
  END LOOP;

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