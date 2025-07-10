-- Remove view_analytics permission action as it's covered by basic read/view permissions
DELETE FROM permission_actions 
WHERE name = 'view_analytics';