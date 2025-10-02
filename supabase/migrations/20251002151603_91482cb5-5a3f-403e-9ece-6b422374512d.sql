-- Create a view for unique resource locations per school
CREATE OR REPLACE VIEW cp_resource_locations AS
SELECT DISTINCT 
  school_id,
  TRIM(location) as location
FROM cp_comp_resources
WHERE location IS NOT NULL 
  AND TRIM(location) != ''
ORDER BY school_id, location;