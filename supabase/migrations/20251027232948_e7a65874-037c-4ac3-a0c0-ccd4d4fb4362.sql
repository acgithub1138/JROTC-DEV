-- Drop the redundant trigger and function (consolidated into handle_new_user)
DROP TRIGGER IF EXISTS trigger_create_parent_contact ON public.profiles;
DROP FUNCTION IF EXISTS public.create_parent_contact();

-- Enhanced handle_new_user function to handle all user types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cadet_id uuid;
  v_phone text;
  v_template_id uuid;
  v_queue_id uuid;
  v_role_name text;
BEGIN
  -- Get the role name for this user
  SELECT COALESCE(ur.role_name::text, NEW.role::text)
  INTO v_role_name
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = NEW.id;

  -- Handle parent-specific logic: create contact record
  IF v_role_name = 'parent' THEN
    -- Extract cadet_id and phone from auth metadata
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
        
        RAISE LOG 'handle_new_user: Created contact for parent % linked to cadet %', NEW.id, v_cadet_id;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'handle_new_user: ERROR creating contact for parent %: %', NEW.id, SQLERRM;
      END;
    ELSE
      RAISE LOG 'handle_new_user: No cadet_id found in metadata for parent %', NEW.id;
    END IF;
  END IF;

  -- Handle judge-specific logic: create cp_judges record
  IF v_role_name = 'judge' THEN
    BEGIN
      INSERT INTO public.cp_judges (
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        NEW.first_name,
        NEW.last_name,
        NEW.email,
        NEW.phone,
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING;
      
      RAISE LOG 'handle_new_user: Created cp_judges record for judge %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ERROR creating cp_judges record for judge %: %', NEW.id, SQLERRM;
    END;
  END IF;

  -- Queue welcome email based on role
  BEGIN
    -- For judges, use global template (no school_id filter)
    IF v_role_name = 'judge' THEN
      SELECT id INTO v_template_id
      FROM public.email_templates
      WHERE source_table = 'profiles'
        AND name ILIKE '%judge%welcome%'
        AND is_global = true
        AND is_active = true
      LIMIT 1;
      
    -- For all other roles, use school-specific template
    ELSE
      SELECT id INTO v_template_id
      FROM public.email_templates
      WHERE source_table = 'profiles'
        AND name ILIKE '%welcome%'
        AND school_id = NEW.school_id
        AND is_active = true
      LIMIT 1;
    END IF;

    -- Queue the welcome email if template found
    IF v_template_id IS NOT NULL THEN
      SELECT public.queue_email(
        v_template_id,
        NEW.email,
        'profiles',
        NEW.id,
        COALESCE(NEW.school_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ) INTO v_queue_id;
      
      RAISE LOG 'handle_new_user: Queued welcome email for % (role: %, queue_id: %)', 
        NEW.id, v_role_name, v_queue_id;
    ELSE
      RAISE LOG 'handle_new_user: No welcome email template found for role % (school_id: %)', 
        v_role_name, NEW.school_id;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: ERROR queueing welcome email for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;