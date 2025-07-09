-- Remove the overly permissive admin update policy
DROP POLICY IF EXISTS "Admins can update any templates" ON public.competition_templates;

-- Add more restrictive admin update policy - admins can only update global templates
CREATE POLICY "Admins can update global templates" 
ON public.competition_templates 
FOR UPDATE 
TO authenticated
USING (get_current_user_role() = 'admin' AND is_global = true)
WITH CHECK (get_current_user_role() = 'admin' AND is_global = true);

-- Also update the delete policy to be more restrictive - admins can only delete global templates
DROP POLICY IF EXISTS "Admins can delete any templates" ON public.competition_templates;

CREATE POLICY "Admins can delete global templates" 
ON public.competition_templates 
FOR DELETE 
TO authenticated
USING (get_current_user_role() = 'admin' AND is_global = true);