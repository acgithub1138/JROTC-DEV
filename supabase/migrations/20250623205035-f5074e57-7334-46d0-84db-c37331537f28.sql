
-- Drop existing policies that we know reference roles
DROP POLICY IF EXISTS "Admins can update their school" ON public.schools;
DROP POLICY IF EXISTS "School admins can update their school" ON public.schools;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Update the user_role enum
ALTER TYPE public.user_role RENAME TO user_role_old;

CREATE TYPE public.user_role AS ENUM ('admin', 'instructor', 'command_staff', 'cadet', 'parent');

-- Update the profiles table to use the new enum
ALTER TABLE public.profiles 
ALTER COLUMN role DROP DEFAULT,
ALTER COLUMN role TYPE public.user_role USING 
  CASE 
    WHEN role::text = 'school_admin' THEN 'admin'::public.user_role
    WHEN role::text = 'instructor' THEN 'instructor'::public.user_role
    WHEN role::text = 'nco' THEN 'command_staff'::public.user_role
    WHEN role::text = 'cadet' THEN 'cadet'::public.user_role
    ELSE 'cadet'::public.user_role
  END,
ALTER COLUMN role SET DEFAULT 'cadet'::public.user_role;

-- Drop the old enum type
DROP TYPE public.user_role_old;

-- Update the handle_new_user function to use the new enum values
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, school_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
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

-- Recreate the essential policies
CREATE POLICY "Admins can update their school" 
  ON public.schools 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND school_id = schools.id
    )
  );

CREATE POLICY "Users can view profiles in their school" 
  ON public.profiles
  FOR SELECT 
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Users can update their own profile" 
  ON public.profiles
  FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles
  FOR INSERT 
  WITH CHECK (id = auth.uid());
