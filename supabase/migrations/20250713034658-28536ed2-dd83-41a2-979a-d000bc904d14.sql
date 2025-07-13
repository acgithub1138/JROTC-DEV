-- Fix Function Search Path Mutable warnings by adding SET search_path

-- Fix validate_role_transition function
CREATE OR REPLACE FUNCTION public.validate_role_transition(
  user_id UUID,
  old_role TEXT,
  new_role TEXT
) RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Log the role change attempt
  INSERT INTO public.profile_history (
    profile_id, field_name, old_value, new_value, changed_by, school_id
  ) VALUES (
    user_id, 'role_change_attempt', old_role, new_role, auth.uid(),
    (SELECT school_id FROM public.profiles WHERE id = user_id)
  );
  
  -- Only admins can change roles
  RETURN (SELECT public.get_current_user_role()) = 'admin';
END;
$$;

-- Fix validate_profile_role_change function
CREATE OR REPLACE FUNCTION public.validate_profile_role_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- If role is being changed, ensure it's by an admin
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF (SELECT public.get_current_user_role()) != 'admin' THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
  END IF;
  
  -- If school_id is being changed, ensure it's by an admin
  IF OLD.school_id IS DISTINCT FROM NEW.school_id THEN
    IF (SELECT public.get_current_user_role()) != 'admin' THEN
      RAISE EXCEPTION 'Only administrators can change user school assignments';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;