-- Add new specific permission actions for granular control
INSERT INTO permission_actions (name, label, description) VALUES
('assign', 'Assign', 'Can assign items to users'),
('activate_deactivate', 'Activate/Deactivate', 'Can activate or deactivate profiles/items'),
('bulk_import', 'Bulk Import', 'Can perform bulk import operations'),
('manage_templates', 'Manage Templates', 'Can create and manage templates'),
('manage_hierarchy', 'Manage Hierarchy', 'Can manage organizational hierarchy'),
('manage_options', 'Manage Options', 'Can manage system options and configurations'),
('reset_password', 'Reset Password', 'Can reset user passwords'),
('view_analytics', 'View Analytics', 'Can view analytics and reports'),
('submit', 'Submit', 'Can submit forms or requests'),
('approve', 'Approve', 'Can approve requests or forms'),
('manage_scoring', 'Manage Scoring', 'Can manage scoring and evaluations');

-- Update default role permissions for admin role with new granular permissions
INSERT INTO default_role_permissions (role, module_id, action_id, enabled) 
SELECT 
  'admin'::user_role,
  pm.id,
  pa.id,
  true
FROM permission_modules pm
CROSS JOIN permission_actions pa
WHERE pa.name IN ('assign', 'activate_deactivate', 'bulk_import', 'manage_templates', 'manage_hierarchy', 'manage_options', 'reset_password', 'view_analytics', 'submit', 'approve', 'manage_scoring');

-- Update default role permissions for instructor role
INSERT INTO default_role_permissions (role, module_id, action_id, enabled) 
SELECT 
  'instructor'::user_role,
  pm.id,
  pa.id,
  CASE 
    WHEN pm.name = 'users' AND pa.name IN ('reset_password', 'activate_deactivate', 'bulk_import') THEN true
    WHEN pm.name = 'tasks' AND pa.name IN ('assign', 'manage_options') THEN true
    WHEN pm.name = 'events' AND pa.name = 'assign' THEN true
    WHEN pm.name = 'competitions' AND pa.name IN ('manage_templates', 'manage_scoring') THEN true
    WHEN pm.name = 'incidents' AND pa.name IN ('submit', 'approve') THEN true
    WHEN pm.name = 'job_board' AND pa.name = 'manage_hierarchy' THEN true
    WHEN pm.name = 'inventory' AND pa.name = 'assign' THEN true
    ELSE false
  END
FROM permission_modules pm
CROSS JOIN permission_actions pa
WHERE pa.name IN ('assign', 'activate_deactivate', 'bulk_import', 'manage_templates', 'manage_hierarchy', 'manage_options', 'reset_password', 'view_analytics', 'submit', 'approve', 'manage_scoring');

-- Update default role permissions for command_staff role
INSERT INTO default_role_permissions (role, module_id, action_id, enabled) 
SELECT 
  'command_staff'::user_role,
  pm.id,
  pa.id,
  CASE 
    WHEN pm.name = 'tasks' AND pa.name = 'assign' THEN true
    WHEN pm.name = 'events' AND pa.name = 'assign' THEN true
    WHEN pm.name = 'job_board' AND pa.name = 'manage_hierarchy' THEN true
    WHEN pm.name = 'inventory' AND pa.name = 'assign' THEN true
    ELSE false
  END
FROM permission_modules pm
CROSS JOIN permission_actions pa
WHERE pa.name IN ('assign', 'activate_deactivate', 'bulk_import', 'manage_templates', 'manage_hierarchy', 'manage_options', 'reset_password', 'view_analytics', 'submit', 'approve', 'manage_scoring');

-- Update default role permissions for cadet role (most actions disabled)
INSERT INTO default_role_permissions (role, module_id, action_id, enabled) 
SELECT 
  'cadet'::user_role,
  pm.id,
  pa.id,
  false
FROM permission_modules pm
CROSS JOIN permission_actions pa
WHERE pa.name IN ('assign', 'activate_deactivate', 'bulk_import', 'manage_templates', 'manage_hierarchy', 'manage_options', 'reset_password', 'view_analytics', 'submit', 'approve', 'manage_scoring');

-- Copy new defaults to role_permissions table
INSERT INTO role_permissions (role, module_id, action_id, enabled)
SELECT role, module_id, action_id, enabled
FROM default_role_permissions drp
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role = drp.role 
  AND rp.module_id = drp.module_id 
  AND rp.action_id = drp.action_id
);