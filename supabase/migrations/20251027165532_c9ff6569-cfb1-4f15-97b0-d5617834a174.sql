-- Make school_id nullable in profiles table to support judges who don't belong to a school
ALTER TABLE public.profiles 
ALTER COLUMN school_id DROP NOT NULL;

-- Update the handle_new_user trigger function to handle judges properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For judge role, create profile without school_id and create judge record
  IF NEW.raw_user_meta_data->>'role' = 'judge' THEN
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      phone,
      role,
      school_id,
      active
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(split_part(NEW.raw_user_meta_data->>'name', ', ', 2), ''),
      COALESCE(split_part(NEW.raw_user_meta_data->>'name', ', ', 1), NEW.raw_user_meta_data->>'name'),
      NEW.raw_user_meta_data->>'phone',
      'judge',
      NULL,
      true
    );
    
    -- Create judge record
    INSERT INTO public.cp_judges (
      user_id,
      name,
      email,
      phone,
      available,
      school_id
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      true,
      NULL
    );
  ELSE
    -- For non-judge users, keep existing behavior (require school_id from metadata)
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      phone,
      role,
      school_id,
      active
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'role', 'cadet'),
      (NEW.raw_user_meta_data->>'school_id')::uuid,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;