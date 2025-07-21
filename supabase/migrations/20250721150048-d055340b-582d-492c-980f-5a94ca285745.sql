-- Drop and recreate the role permissions read policy to ensure it's working correctly
DROP POLICY IF EXISTS "Everyone can view role permissions" ON public.role_permissions;

CREATE POLICY "Everyone can view role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (true);