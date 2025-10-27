-- Create trigger function to auto-create contact for parent users
CREATE OR REPLACE FUNCTION public.create_parent_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cadet_id uuid;
  v_phone text;
BEGIN
  -- Only process if role is 'parent'
  IF NEW.role = 'parent' THEN
    -- Extract cadet_id and phone from the auth metadata (passed during signup)
    SELECT 
      (u.raw_user_meta_data ->> 'cadet_id')::uuid,
      u.raw_user_meta_data ->> 'phone'
    INTO v_cadet_id, v_phone
    FROM auth.users u
    WHERE u.id = NEW.id;
    
    -- Create contact record linking parent to cadet
    IF v_cadet_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.contacts (
          name,
          email,
          phone,
          type,
          status,
          cadet_id,
          school_id,
          created_by
        )
        VALUES (
          NEW.last_name || ', ' || NEW.first_name,
          NEW.email,
          v_phone,
          'parent'::contact_type,
          'active'::contact_status,
          v_cadet_id,
          NEW.school_id,
          NEW.id
        );
        
        RAISE LOG 'create_parent_contact: Created contact for parent % linked to cadet %', NEW.id, v_cadet_id;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'create_parent_contact: ERROR creating contact for parent %: %', NEW.id, SQLERRM;
      END;
    ELSE
      RAISE LOG 'create_parent_contact: No cadet_id found in metadata for parent %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire after profile insert
CREATE TRIGGER trigger_create_parent_contact
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_parent_contact();