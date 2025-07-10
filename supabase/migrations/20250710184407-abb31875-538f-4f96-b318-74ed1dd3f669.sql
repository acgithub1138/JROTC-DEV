-- Update permission action descriptions to reflect new semantics
UPDATE permission_actions 
SET description = 'Access to module/page via navigation and sidebar'
WHERE name = 'sidebar';

UPDATE permission_actions 
SET description = 'Access to view individual record details in modals/popups'
WHERE name = 'view';

UPDATE permission_actions 
SET description = 'Access to see data in tables, lists, and related content'
WHERE name = 'read';