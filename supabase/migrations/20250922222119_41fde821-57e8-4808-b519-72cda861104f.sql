-- Update the handle_new_user trigger function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  generated_password text;
  profile_insert_success boolean := false;
BEGIN
  -- Log the start of user creation process
  RAISE LOG 'handle_new_user: Processing new user %', NEW.id;
  
  -- Extract generated password from metadata
  generated_password := NEW.raw_user_meta_data ->> 'generated_password';
  
  -- Log password extraction status
  IF generated_password IS NOT NULL THEN
    RAISE LOG 'handle_new_user: Found generated password for user %', NEW.id;
  ELSE
    RAISE LOG 'handle_new_user: No generated password found for user %', NEW.id;
  END IF;
  
  -- Attempt to insert the profile with error handling
  BEGIN
    INSERT INTO public.profiles (
      id, 
      first_name, 
      last_name, 
      email, 
      role, 
      temp_pswd,
      password_change_required
    )
    VALUES (
      NEW.id, 
      NEW.raw_user_meta_data ->> 'first_name', 
      NEW.raw_user_meta_data ->> 'last_name',
      COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'cadet'),
      generated_password,
      CASE WHEN generated_password IS NOT NULL THEN true ELSE false END
    );
    
    profile_insert_success := true;
    RAISE LOG 'handle_new_user: Successfully created profile for user %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'handle_new_user: ERROR creating profile for user %: %', NEW.id, SQLERRM;
    
    -- Try a simpler insert as fallback
    BEGIN
      INSERT INTO public.profiles (id, email, role)
      VALUES (NEW.id, COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'), 'cadet');
      
      RAISE LOG 'handle_new_user: Fallback profile creation succeeded for user %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: CRITICAL ERROR - Even fallback failed for user %: %', NEW.id, SQLERRM;
      -- We still return NEW to not block user creation
    END;
  END;
  
  -- If profile creation failed but we have a generated password, try to update it
  IF NOT profile_insert_success AND generated_password IS NOT NULL THEN
    BEGIN
      UPDATE public.profiles 
      SET 
        temp_pswd = generated_password,
        password_change_required = true,
        updated_at = now()
      WHERE id = NEW.id;
      
      IF FOUND THEN
        RAISE LOG 'handle_new_user: Updated existing profile with password for user %', NEW.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ERROR updating profile with password for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;