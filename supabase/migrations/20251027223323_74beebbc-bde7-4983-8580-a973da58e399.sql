-- Restore handle_new_user function to extract all metadata and support all user types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  generated_password text;
  v_school_id uuid;
  v_role_id uuid;
  v_role text;
  v_phone text;
  v_grade text;
  v_rank text;
  v_flight text;
  v_cadet_year text;
  v_start_year int;
BEGIN
  RAISE LOG 'handle_new_user: Processing new user %', NEW.id;
  
  -- Extract all metadata
  generated_password := NEW.raw_user_meta_data ->> 'generated_password';
  v_school_id := (NEW.raw_user_meta_data ->> 'school_id')::uuid;
  v_role_id := (NEW.raw_user_meta_data ->> 'role_id')::uuid;
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'cadet');
  v_phone := NEW.raw_user_meta_data ->> 'phone';
  v_grade := NEW.raw_user_meta_data ->> 'grade';
  v_rank := NEW.raw_user_meta_data ->> 'rank';
  v_flight := NEW.raw_user_meta_data ->> 'flight';
  v_cadet_year := NEW.raw_user_meta_data ->> 'cadet_year';
  v_start_year := (NEW.raw_user_meta_data ->> 'start_year')::int;
  
  -- Insert profile with all extracted data
  BEGIN
    INSERT INTO public.profiles (
      id, 
      first_name, 
      last_name, 
      email,
      phone,
      role,
      role_id,
      school_id,
      grade,
      rank,
      flight,
      cadet_year,
      start_year,
      temp_pswd,
      password_change_required,
      active
    )
    VALUES (
      NEW.id, 
      NEW.raw_user_meta_data ->> 'first_name', 
      NEW.raw_user_meta_data ->> 'last_name',
      COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
      v_phone,
      v_role,
      v_role_id,
      v_school_id,
      v_grade,
      v_rank,
      v_flight,
      v_cadet_year,
      v_start_year,
      generated_password,
      CASE WHEN generated_password IS NOT NULL THEN true ELSE false END,
      true
    );
    
    RAISE LOG 'handle_new_user: Successfully created profile for user %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: ERROR creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;
  
  -- If user is a judge, create cp_judges record
  IF v_role = 'judge' THEN
    BEGIN
      INSERT INTO public.cp_judges (
        user_id,
        name,
        email,
        phone,
        available,
        school_id
      )
      VALUES (
        NEW.id,
        (NEW.raw_user_meta_data ->> 'last_name') || ', ' || (NEW.raw_user_meta_data ->> 'first_name'),
        COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
        v_phone,
        true,
        NULL
      );
      
      RAISE LOG 'handle_new_user: Created cp_judges record for user %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ERROR creating cp_judges record for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  -- Queue welcome email if school_id exists and user is not a judge
  IF v_school_id IS NOT NULL AND v_role != 'judge' THEN
    BEGIN
      DECLARE
        v_template_id uuid;
      BEGIN
        -- Find active welcome email template
        SELECT id INTO v_template_id
        FROM email_templates
        WHERE school_id = v_school_id
          AND source_table = 'profiles'
          AND name ILIKE '%welcome%'
          AND is_active = true
        LIMIT 1;
        
        IF v_template_id IS NOT NULL THEN
          PERFORM queue_email(
            v_template_id,
            COALESCE(NEW.email, NEW.raw_user_meta_data ->> 'email'),
            'profiles',
            NEW.id,
            v_school_id
          );
          
          RAISE LOG 'handle_new_user: Queued welcome email for user %', NEW.id;
        ELSE
          RAISE LOG 'handle_new_user: No welcome email template found for school %', v_school_id;
        END IF;
      END;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ERROR queueing welcome email for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;