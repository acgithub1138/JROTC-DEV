-- Drop the existing insert policy
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_us;

-- Create a new policy that explicitly allows anonymous users to submit contact forms
CREATE POLICY "Allow anonymous contact form submissions" 
ON public.contact_us 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also ensure the policy covers all scenarios
CREATE POLICY "Allow public contact form submissions" 
ON public.contact_us 
FOR INSERT 
WITH CHECK (
  -- Allow any user (authenticated or anonymous) to submit
  true
);