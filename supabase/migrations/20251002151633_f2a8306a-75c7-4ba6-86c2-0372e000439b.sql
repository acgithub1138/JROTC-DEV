-- Add RLS policies for the cp_resource_locations view
ALTER VIEW cp_resource_locations SET (security_invoker = true);

-- Create RLS policy for reading locations
CREATE POLICY "Users can view their school's resource locations"
ON cp_comp_resources
FOR SELECT
USING (is_user_in_school(school_id));