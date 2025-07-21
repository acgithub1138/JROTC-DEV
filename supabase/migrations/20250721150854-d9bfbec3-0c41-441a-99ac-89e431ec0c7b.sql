
-- Drop the conflicting "Only admins can manage role permissions" policy that blocks non-admin reads
DROP POLICY IF EXISTS "Only admins can manage role permissions" ON public.role_permissions;

-- Create specific policies for admin operations only
CREATE POLICY "Only admins can insert role permissions" 
ON public.role_permissions 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can update role permissions" 
ON public.role_permissions 
FOR UPDATE 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Only admins can delete role permissions" 
ON public.role_permissions 
FOR DELETE 
USING (get_current_user_role() = 'admin');
