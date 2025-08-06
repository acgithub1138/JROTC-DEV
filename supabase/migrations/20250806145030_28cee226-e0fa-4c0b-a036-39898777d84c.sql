-- Final comprehensive search_path security fix - catch any remaining functions

-- Fix add_user_role function  
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

-- Fix add_user_role_to_table function
CREATE OR REPLACE FUNCTION public.add_user_role_to_table(role_name_param text, role_label_param text DEFAULT NULL::text, admin_only_param boolean DEFAULT false)
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

-- Fix check_email_queue_health function
CREATE OR REPLACE FUNCTION public.check_email_queue_health()
RETURNS TABLE(school_id uuid, pending_count integer, stuck_count integer, failed_count integer, processing_time_avg_ms integer, health_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  stuck_threshold INTERVAL := '10 minutes';
  health_record RECORD;
BEGIN
  -- Check each school's email queue health
  FOR health_record IN
    SELECT 
      eq.school_id,
      COUNT(CASE WHEN eq.status = 'pending' THEN 1 END)::integer as pending_count,
      COUNT(CASE WHEN eq.status = 'processing' AND eq.last_attempt_at < (now() - stuck_threshold) THEN 1 END)::integer as stuck_count,
      COUNT(CASE WHEN eq.status = 'failed' THEN 1 END)::integer as failed_count,
      COALESCE(
        EXTRACT(EPOCH FROM AVG(eq.sent_at - eq.created_at))::integer * 1000,
        NULL
      )::integer as processing_time_avg_ms
    FROM public.email_queue eq
    WHERE eq.created_at > (now() - INTERVAL '24 hours')
    GROUP BY eq.school_id
  LOOP
    -- Determine health status
    DECLARE
      status_text text := 'healthy';
    BEGIN
      IF health_record.stuck_count > 5 THEN
        status_text := 'critical';
      ELSIF health_record.stuck_count > 0 OR health_record.pending_count > 20 THEN
        status_text := 'warning';
      ELSIF health_record.failed_count > 10 THEN
        status_text := 'degraded';
      END IF;
      
      -- Insert health record
      INSERT INTO public.email_queue_health (
        school_id,
        pending_count,
        stuck_count,
        failed_count,
        processing_time_avg_ms,
        health_status
      ) VALUES (
        health_record.school_id,
        health_record.pending_count,
        health_record.stuck_count,
        health_record.failed_count,
        health_record.processing_time_avg_ms,
        status_text
      );
      
      -- Return the result
      school_id := health_record.school_id;
      pending_count := health_record.pending_count;
      stuck_count := health_record.stuck_count;
      failed_count := health_record.failed_count;
      processing_time_avg_ms := health_record.processing_time_avg_ms;
      health_status := status_text;
      
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$function$;