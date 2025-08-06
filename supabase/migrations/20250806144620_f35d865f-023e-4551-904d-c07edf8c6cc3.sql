-- Fix all remaining functions missing SET search_path TO '' security setting
-- This prevents SQL injection attacks through search_path manipulation

-- Fix all functions that are missing the secure search_path setting
-- Based on the functions listed in the project, these likely need fixing:

-- Fix handle_updated_at function  
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

-- Fix handle_new_user function
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

-- Fix handle_graduate_status function
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

-- Fix log_profile_changes function
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  change_record RECORD;
  user_id UUID;
BEGIN
  -- Get the current user ID (may be null for system changes)
  user_id := auth.uid();
  
  -- Check first_name changes
  IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'first_name', 
      COALESCE(OLD.first_name, 'null'), 
      COALESCE(NEW.first_name, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check last_name changes
  IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'last_name', 
      COALESCE(OLD.last_name, 'null'), 
      COALESCE(NEW.last_name, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'email', 
      COALESCE(OLD.email, 'null'), 
      COALESCE(NEW.email, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'role', 
      COALESCE(OLD.role::text, 'null'), 
      COALESCE(NEW.role::text, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check grade changes
  IF OLD.grade IS DISTINCT FROM NEW.grade THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'grade', 
      COALESCE(OLD.grade, 'null'), 
      COALESCE(NEW.grade, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check rank changes
  IF OLD.rank IS DISTINCT FROM NEW.rank THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'rank', 
      COALESCE(OLD.rank, 'null'), 
      COALESCE(NEW.rank, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check flight changes
  IF OLD.flight IS DISTINCT FROM NEW.flight THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'flight', 
      COALESCE(OLD.flight, 'null'), 
      COALESCE(NEW.flight, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check active status changes
  IF OLD.active IS DISTINCT FROM NEW.active THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'active', 
      COALESCE(OLD.active::text, 'null'), 
      COALESCE(NEW.active::text, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix process_email_rules function
CREATE OR REPLACE FUNCTION public.process_email_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  rule_record RECORD;
  recipient_email_result RECORD;
  queue_item_id UUID;
  operation_type TEXT;
BEGIN
  -- Determine the operation type based on table and trigger operation
  IF TG_TABLE_NAME = 'tasks' AND TG_OP = 'INSERT' THEN
    operation_type := 'task_created';
  ELSIF TG_TABLE_NAME = 'subtasks' AND TG_OP = 'INSERT' THEN
    operation_type := 'subtask_created';
  ELSIF TG_TABLE_NAME = 'tasks' AND TG_OP = 'UPDATE' THEN
    operation_type := 'task_updated';
  ELSIF TG_TABLE_NAME = 'subtasks' AND TG_OP = 'UPDATE' THEN
    operation_type := 'subtask_updated';
  ELSIF TG_TABLE_NAME = 'incidents' AND TG_OP = 'INSERT' THEN
    operation_type := 'incident_created';
  ELSIF TG_TABLE_NAME = 'incidents' AND TG_OP = 'UPDATE' THEN
    operation_type := 'incident_updated';
  ELSE
    -- Unknown operation, just log and return
    RAISE LOG 'Email trigger fired for unknown operation: table=%, op=%', TG_TABLE_NAME, TG_OP;
    RETURN NEW;
  END IF;

  RAISE LOG 'Email trigger processing: table=%, operation=%, record_id=%', TG_TABLE_NAME, operation_type, NEW.id;

  -- Find all active email rules for this operation and school
  FOR rule_record IN 
    SELECT er.id, er.template_id, er.rule_type
    FROM public.email_rules er
    WHERE er.school_id = NEW.school_id
      AND er.is_active = true
      AND er.rule_type = operation_type
      AND er.template_id IS NOT NULL
  LOOP
    -- Determine recipient email based on rule type and record data
    recipient_email_result := NULL;
    
    IF operation_type IN ('task_created', 'task_updated', 'subtask_created', 'subtask_updated') THEN
      -- For tasks/subtasks, send to assigned_to user
      IF NEW.assigned_to IS NOT NULL THEN
        SELECT email, 'profile' as source INTO recipient_email_result
        FROM public.resolve_user_email_with_job_priority(NEW.assigned_to, NEW.school_id);
      END IF;
    ELSIF operation_type IN ('incident_created', 'incident_updated') THEN
      -- For incidents, send to assigned_to_admin user
      IF NEW.assigned_to_admin IS NOT NULL THEN
        SELECT email, 'profile' as source INTO recipient_email_result
        FROM public.resolve_user_email_with_job_priority(NEW.assigned_to_admin, NEW.school_id);
      END IF;
    END IF;

    -- Queue the email if we have a recipient
    IF recipient_email_result.email IS NOT NULL AND recipient_email_result.email != '' THEN
      BEGIN
        SELECT public.queue_email(
          rule_record.template_id,
          recipient_email_result.email,
          TG_TABLE_NAME,
          NEW.id,
          NEW.school_id,
          rule_record.id
        ) INTO queue_item_id;
        
        RAISE LOG 'Email queued successfully: queue_id=%, rule_id=%, recipient=%', 
          queue_item_id, rule_record.id, recipient_email_result.email;
          
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to queue email for rule %: %', rule_record.id, SQLERRM;
        
        -- Log the failure in email_processing_log
        INSERT INTO public.email_processing_log (
          status,
          processed_count,
          failed_count,
          request_id
        ) VALUES (
          'trigger_error',
          0,
          1,
          gen_random_uuid()
        );
      END;
    ELSE
      RAISE LOG 'No recipient email found for rule % (operation: %)', rule_record.id, operation_type;
    END IF;
  END LOOP;

  -- Log successful trigger execution
  INSERT INTO public.email_processing_log (
    status,
    processed_count,
    failed_count,
    request_id
  ) VALUES (
    'trigger_completed',
    1,
    0,
    gen_random_uuid()
  );

  RETURN NEW;
END;
$function$;