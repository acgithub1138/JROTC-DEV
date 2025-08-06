-- Allow authenticated users to insert new schools
DROP POLICY IF EXISTS "Authenticated users can create schools" ON public.schools;

CREATE POLICY "Authenticated users can create schools" 
ON public.schools 
FOR INSERT 
TO authenticated 
WITH CHECK (true);