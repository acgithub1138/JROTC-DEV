-- Add new permission action for updating assigned tasks
INSERT INTO permission_actions (name, label, description) 
VALUES ('update_assigned', 'Update Assigned', 'Can update tasks assigned to the user');

-- Set default permissions for the new action
-- Cadets can update assigned tasks by default
INSERT INTO default_role_permissions (role, module_id, action_id, enabled)
SELECT 
  'cadet'::user_role,
  pm.id,
  pa.id,
  true
FROM permission_modules pm, permission_actions pa
WHERE pm.name = 'tasks' AND pa.name = 'update_assigned';

-- Command staff can update assigned tasks by default  
INSERT INTO default_role_permissions (role, module_id, action_id, enabled)
SELECT 
  'command_staff'::user_role,
  pm.id,
  pa.id,
  true
FROM permission_modules pm, permission_actions pa
WHERE pm.name = 'tasks' AND pa.name = 'update_assigned';

-- Instructors can update assigned tasks by default
INSERT INTO default_role_permissions (role, module_id, action_id, enabled)
SELECT 
  'instructor'::user_role,
  pm.id,
  pa.id,
  true  
FROM permission_modules pm, permission_actions pa
WHERE pm.name = 'tasks' AND pa.name = 'update_assigned';

-- Admins can update assigned tasks by default
INSERT INTO default_role_permissions (role, module_id, action_id, enabled)
SELECT 
  'admin'::user_role,
  pm.id,
  pa.id,
  true
FROM permission_modules pm, permission_actions pa
WHERE pm.name = 'tasks' AND pa.name = 'update_assigned';