
-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Users can view profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete profiles based on role" ON public.profiles;

-- Create a security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Create a security definer function to get user school_id
CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER STABLE
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Policy for viewing profiles (READ)
CREATE POLICY "Users can view profiles based on role" 
  ON public.profiles
  FOR SELECT 
  USING (
    -- Admins can see all profiles
    public.get_current_user_role() = 'admin'
    OR 
    -- Instructors can see all profiles in their school
    (public.get_current_user_role() = 'instructor' AND school_id = public.get_current_user_school_id())
    OR 
    -- Command staff can see command staff and cadets in their school
    (public.get_current_user_role() = 'command_staff' 
     AND school_id = public.get_current_user_school_id() 
     AND role IN ('command_staff', 'cadet'))
    OR 
    -- Cadets can see their own profile
    (public.get_current_user_role() = 'cadet' AND id = auth.uid())
    OR 
    -- Users can always see their own profile
    id = auth.uid()
  );

-- Policy for updating profiles (UPDATE)
CREATE POLICY "Users can update profiles based on role" 
  ON public.profiles
  FOR UPDATE 
  USING (
    -- Admins can update all profiles
    public.get_current_user_role() = 'admin'
    OR 
    -- Instructors can update all profiles in their school
    (public.get_current_user_role() = 'instructor' AND school_id = public.get_current_user_school_id())
    OR 
    -- Command staff can update command staff and cadets in their school
    (public.get_current_user_role() = 'command_staff' 
     AND school_id = public.get_current_user_school_id() 
     AND role IN ('command_staff', 'cadet'))
    OR 
    -- Cadets can update their own profile
    (public.get_current_user_role() = 'cadet' AND id = auth.uid())
    OR 
    -- Users can always update their own profile
    id = auth.uid()
  );

-- Policy for inserting profiles (CREATE)
CREATE POLICY "Users can insert profiles based on role" 
  ON public.profiles
  FOR INSERT 
  WITH CHECK (
    -- Admins can create profiles anywhere
    public.get_current_user_role() = 'admin'
    OR 
    -- Instructors can create profiles in their school
    (public.get_current_user_role() = 'instructor' AND school_id = public.get_current_user_school_id())
    OR 
    -- Users can create their own profile (for signup)
    id = auth.uid()
  );

-- Policy for deleting profiles (DELETE)
CREATE POLICY "Users can delete profiles based on role" 
  ON public.profiles
  FOR DELETE 
  USING (
    -- Admins can delete all profiles
    public.get_current_user_role() = 'admin'
    OR 
    -- Instructors can delete profiles in their school (but not other admins/instructors)
    (public.get_current_user_role() = 'instructor' 
     AND school_id = public.get_current_user_school_id()
     AND role NOT IN ('admin', 'instructor'))
  );
