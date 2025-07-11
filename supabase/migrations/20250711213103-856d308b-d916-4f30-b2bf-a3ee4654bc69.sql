-- Complete fix for infinite recursion in profiles RLS policies
-- Drop all existing policies that cause circular dependencies
DROP POLICY IF EXISTS "Users can view profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic profile info for incident assignments" ON public.profiles;
DROP POLICY IF EXISTS "School members can view each other" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles during signup" ON public.profiles;

-- Update system functions to use SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Create simple, non-recursive policies for profiles
-- Policy 1: Users can always view and update their own profile
CREATE POLICY "Users can manage their own profile" 
ON public.profiles 
FOR ALL 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Basic profile visibility for same school (using the updated function)
CREATE POLICY "School members can view each other" 
ON public.profiles 
FOR SELECT 
USING (school_id = get_current_user_school_id());

-- Policy 3: System can insert profiles during signup
CREATE POLICY "System can insert profiles during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);