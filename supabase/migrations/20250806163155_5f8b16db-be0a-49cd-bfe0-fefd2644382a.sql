-- Create security definer functions for better RLS performance
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT auth.uid();
$$;

-- Update existing functions to use consistent pattern
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT ur.role_name 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.role_id = ur.id
  WHERE p.id = public.get_current_user_id();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT school_id FROM public.profiles WHERE id = public.get_current_user_id();
$$;