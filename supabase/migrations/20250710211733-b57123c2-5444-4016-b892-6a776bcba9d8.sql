-- Add role_permissions entries for the new update_assigned action
INSERT INTO role_permissions (role, module_id, action_id, enabled)
SELECT 
  drp.role,
  drp.module_id,
  drp.action_id,
  drp.enabled
FROM default_role_permissions drp
JOIN permission_modules pm ON drp.module_id = pm.id
JOIN permission_actions pa ON drp.action_id = pa.id
WHERE pm.name = 'tasks' AND pa.name = 'update_assigned'
ON CONFLICT (role, module_id, action_id) DO NOTHING;