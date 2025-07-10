-- Disable update permission for instructor role on tasks module
UPDATE role_permissions 
SET enabled = false 
WHERE role = 'instructor' 
  AND module_id = (SELECT id FROM permission_modules WHERE name = 'tasks')
  AND action_id = (SELECT id FROM permission_actions WHERE name = 'update');