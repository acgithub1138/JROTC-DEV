-- Let's check the exact roles and fix the policy
-- First, drop the current policy
DROP POLICY IF EXISTS "Contact form submissions allowed" ON public.contact_us;

-- Create a policy that explicitly targets anon and authenticated roles
CREATE POLICY "Contact form submissions allowed" 
ON public.contact_us 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also verify RLS is properly enabled
ALTER TABLE public.contact_us ENABLE ROW LEVEL SECURITY;