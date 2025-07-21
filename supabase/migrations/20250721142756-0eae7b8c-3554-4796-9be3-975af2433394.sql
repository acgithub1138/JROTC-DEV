-- Update the validate_profile_role_change function to allow users with Reset Password permission to also change roles
CREATE OR REPLACE FUNCTION public.validate_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- If role is being changed, check permissions
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Admins can change any role
    IF (SELECT public.get_current_user_role()) = 'admin' THEN
      RETURN NEW;
    END IF;
    
    -- Users with "Reset Password" permission for cadets can change roles
    IF (SELECT public.check_user_permission(auth.uid(), 'cadets', 'reset_password')) = true THEN
      RETURN NEW;
    END IF;
    
    -- Instructors can only change cadet roles to command_staff within their school
    IF (SELECT public.get_current_user_role()) = 'instructor' AND
       OLD.role = 'cadet' AND 
       NEW.role = 'command_staff' AND
       OLD.school_id = (SELECT public.get_current_user_school_id()) THEN
      RETURN NEW;
    END IF;
    
    -- Instructors can also change command_staff back to cadet within their school
    IF (SELECT public.get_current_user_role()) = 'instructor' AND
       OLD.role = 'command_staff' AND 
       NEW.role = 'cadet' AND
       OLD.school_id = (SELECT public.get_current_user_school_id()) THEN
      RETURN NEW;
    END IF;
    
    -- Otherwise, deny the role change
    RAISE EXCEPTION 'Only administrators, users with Reset Password permission for cadets, or instructors can change user roles (instructors limited to cadet/command_staff transitions)';
  END IF;
  
  -- If school_id is being changed, ensure it's by an admin or user with Reset Password permission
  IF OLD.school_id IS DISTINCT FROM NEW.school_id THEN
    IF (SELECT public.get_current_user_role()) != 'admin' AND 
       (SELECT public.check_user_permission(auth.uid(), 'cadets', 'reset_password')) != true THEN
      RAISE EXCEPTION 'Only administrators or users with Reset Password permission can change user school assignments';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;