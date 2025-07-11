-- Remove all role permissions for the "assign" action in the "teams" module
DELETE FROM public.role_permissions 
WHERE action_id = '1606167f-2801-4e7e-b017-b255a7bb0998' 
  AND module_id = (SELECT id FROM public.permission_modules WHERE name = 'teams');

-- Remove the "assign" action from default role permissions for teams
DELETE FROM public.default_role_permissions 
WHERE action_id = '1606167f-2801-4e7e-b017-b255a7bb0998' 
  AND module_id = (SELECT id FROM public.permission_modules WHERE name = 'teams');