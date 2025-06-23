
-- Update the handle_new_user function to properly use the school_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, school_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    -- Use school_id from metadata, fallback to first available school if not provided
    COALESCE(
      (NEW.raw_user_meta_data ->> 'school_id')::uuid,
      (SELECT id FROM public.schools LIMIT 1)
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'cadet')
  );
  RETURN NEW;
END;
$$;

-- Also create a default school if none exists (this helps prevent the null school_id issue)
INSERT INTO public.schools (name, district, city, state) 
SELECT 'Default JROTC School', 'Default District', 'Default City', 'Default State'
WHERE NOT EXISTS (SELECT 1 FROM public.schools);
