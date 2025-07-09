-- Add RLS policy to allow admins to view all competition templates
CREATE POLICY "Admins can view all templates" 
ON public.competition_templates 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = 'admin');