-- Remove manage_templates permission action as it's covered by basic competition CRUD permissions
DELETE FROM permission_actions 
WHERE name = 'manage_templates';