-- Drop all existing insert policies on contact_us table
DROP POLICY IF EXISTS "Allow anonymous contact form submissions" ON public.contact_us;
DROP POLICY IF EXISTS "Allow public contact form submissions" ON public.contact_us;
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_us;

-- Create a single, simple INSERT policy that allows all users
CREATE POLICY "Contact form submissions allowed" 
ON public.contact_us 
FOR INSERT 
WITH CHECK (true);