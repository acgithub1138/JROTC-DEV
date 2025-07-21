-- Create user_history table for tracking role changes and audit logging
CREATE TABLE public.user_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  change_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  school_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_history
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_history
CREATE POLICY "Admins can view all user history" 
  ON public.user_history 
  FOR SELECT 
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Instructors can view user history in their school" 
  ON public.user_history 
  FOR SELECT 
  USING (
    school_id = get_current_user_school_id() AND 
    get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
  );

CREATE POLICY "System can insert user history" 
  ON public.user_history 
  FOR INSERT 
  WITH CHECK (true);

-- Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.user_history (
      user_id,
      field_name,
      old_value,
      new_value,
      changed_by,
      change_reason,
      school_id
    ) VALUES (
      NEW.id,
      'role',
      OLD.role::text,
      NEW.role::text,
      auth.uid(),
      'Role change via profile update',
      NEW.school_id
    );
  END IF;

  -- Log school changes
  IF OLD.school_id IS DISTINCT FROM NEW.school_id THEN
    INSERT INTO public.user_history (
      user_id,
      field_name,
      old_value,
      new_value,
      changed_by,
      change_reason,
      school_id
    ) VALUES (
      NEW.id,
      'school_id',
      OLD.school_id::text,
      NEW.school_id::text,
      auth.uid(),
      'School assignment change',
      NEW.school_id
    );
  END IF;

  -- Log active status changes
  IF OLD.active IS DISTINCT FROM NEW.active THEN
    INSERT INTO public.user_history (
      user_id,
      field_name,
      old_value,
      new_value,
      changed_by,
      change_reason,
      school_id
    ) VALUES (
      NEW.id,
      'active',
      OLD.active::text,
      NEW.active::text,
      auth.uid(),
      'Active status change',
      NEW.school_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS log_profile_changes ON public.profiles;
CREATE TRIGGER log_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- Fix database functions missing SET search_path TO '' protection
-- Update functions that are missing this security protection

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN (SELECT school_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN (SELECT role::text FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN (SELECT school_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Update process_email_template function to add missing security
CREATE OR REPLACE FUNCTION public.process_email_template(template_text text, data_json jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO ''
AS $$
DECLARE
  result_text text;
  key_name text;
  value_text text;
BEGIN
  result_text := template_text;
  
  -- Replace variables in the format {{variable_name}}
  FOR key_name IN SELECT jsonb_object_keys(data_json) LOOP
    value_text := COALESCE(data_json ->> key_name, '');
    result_text := replace(result_text, '{{' || key_name || '}}', value_text);
  END LOOP;
  
  RETURN result_text;
END;
$$;

-- Create index for performance on user_history
CREATE INDEX idx_user_history_user_id ON public.user_history(user_id);
CREATE INDEX idx_user_history_created_at ON public.user_history(created_at);
CREATE INDEX idx_user_history_field_name ON public.user_history(field_name);

-- Create function to get user history with pagination
CREATE OR REPLACE FUNCTION public.get_user_history(
  target_user_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  changed_by_name TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only admins can view all history, others can only view their school's history
  IF get_current_user_role() = 'admin' THEN
    RETURN QUERY
    SELECT 
      uh.id,
      uh.user_id,
      uh.field_name,
      uh.old_value,
      uh.new_value,
      uh.changed_by,
      uh.change_reason,
      uh.created_at,
      COALESCE(p.first_name || ' ' || p.last_name, 'System') as changed_by_name
    FROM public.user_history uh
    LEFT JOIN public.profiles p ON uh.changed_by = p.id
    WHERE (target_user_id IS NULL OR uh.user_id = target_user_id)
    ORDER BY uh.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
  ELSE
    RETURN QUERY
    SELECT 
      uh.id,
      uh.user_id,
      uh.field_name,
      uh.old_value,
      uh.new_value,
      uh.changed_by,
      uh.change_reason,
      uh.created_at,
      COALESCE(p.first_name || ' ' || p.last_name, 'System') as changed_by_name
    FROM public.user_history uh
    LEFT JOIN public.profiles p ON uh.changed_by = p.id
    WHERE uh.school_id = get_current_user_school_id()
      AND (target_user_id IS NULL OR uh.user_id = target_user_id)
    ORDER BY uh.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
  END IF;
END;
$$;