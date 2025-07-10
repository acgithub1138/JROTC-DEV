-- Remove redundant permission actions that are covered by basic CRUD permissions
DELETE FROM permission_actions 
WHERE name IN ('manage_hierarchy', 'manage_options', 'manage_scoring', 'approve', 'submit');