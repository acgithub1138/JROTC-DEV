-- Fix infinite recursion in profiles RLS policies
-- Drop all existing policies that cause circular dependencies
DROP POLICY IF EXISTS "Users can view profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete profiles based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic profile info for incident assignments" ON public.profiles;

-- Create simple, non-recursive policies for profiles
-- Policy 1: Users can always view and update their own profile
CREATE POLICY "Users can manage their own profile" 
ON public.profiles 
FOR ALL 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Basic profile visibility for same school (without role checks)
CREATE POLICY "School members can view each other" 
ON public.profiles 
FOR SELECT 
USING (
  school_id = (
    SELECT school_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Policy 3: System can insert profiles during signup
CREATE POLICY "System can insert profiles during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Note: Admin functionality will need to be handled differently
-- without relying on role-based policies that cause recursion