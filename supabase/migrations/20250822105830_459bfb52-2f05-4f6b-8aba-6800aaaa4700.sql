-- Create function to sync profile role with role_name from user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  role_name_value text;
BEGIN
  -- Get the role_name from user_roles table
  IF NEW.role_id IS NOT NULL THEN
    SELECT ur.role_name INTO role_name_value
    FROM public.user_roles ur
    WHERE ur.id = NEW.role_id;
    
    -- Update the role field with the role_name
    IF role_name_value IS NOT NULL THEN
      -- Cast the role_name to the user_role enum type
      NEW.role := role_name_value::public.user_role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync profile role when role_id changes
DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.profiles;
CREATE TRIGGER sync_profile_role_trigger
  BEFORE INSERT OR UPDATE OF role_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role();

-- Update existing profiles to sync their role field with role_name
UPDATE public.profiles 
SET role = ur.role_name::public.user_role
FROM public.user_roles ur
WHERE profiles.role_id = ur.id
  AND profiles.role_id IS NOT NULL;