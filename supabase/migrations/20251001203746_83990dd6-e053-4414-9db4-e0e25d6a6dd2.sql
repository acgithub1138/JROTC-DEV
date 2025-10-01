-- Create a view that joins role_permissions with user_roles
-- This allows querying permissions by role_name directly without a separate role lookup
CREATE OR REPLACE VIEW role_permission_details AS
SELECT 
    ur.role_name,
    rp.role_id,
    rp.module_id,
    rp.action_id,
    rp.enabled
FROM role_permissions rp
JOIN user_roles ur ON rp.role_id = ur.id;

-- Grant select access to authenticated users
GRANT SELECT ON role_permission_details TO authenticated;