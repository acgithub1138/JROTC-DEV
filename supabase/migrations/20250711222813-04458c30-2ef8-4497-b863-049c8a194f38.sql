-- Fix incident management module name mismatch
-- Update the module name from 'incidents' to 'incident_management' to match the code expectations

UPDATE permission_modules 
SET name = 'incident_management'
WHERE name = 'incidents';

-- Verify the update worked
SELECT id, name, label FROM permission_modules WHERE name = 'incident_management';