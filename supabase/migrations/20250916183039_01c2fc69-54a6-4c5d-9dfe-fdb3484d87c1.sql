-- Enable RLS on the views and add policies
ALTER VIEW teams_with_members SET (security_barrier = true);
ALTER VIEW parent_cadet_tasks SET (security_barrier = true);
ALTER VIEW dashboard_stats SET (security_barrier = true);

-- Create RLS policies for teams_with_members view
CREATE POLICY "teams_with_members: read access" ON teams_with_members
  FOR SELECT USING (
    is_current_user_admin_role() OR 
    (can_user_access('teams'::text, 'read'::text) AND is_user_in_school(school_id))
  );

-- Create RLS policies for parent_cadet_tasks view  
CREATE POLICY "parent_cadet_tasks: read access" ON parent_cadet_tasks
  FOR SELECT USING (
    is_current_user_admin_role() OR 
    (can_user_access('tasks'::text, 'read'::text) AND is_user_in_school(school_id)) OR
    (parent_email = (SELECT email FROM profiles WHERE id = auth.uid()))
  );

-- Create RLS policies for dashboard_stats view
CREATE POLICY "dashboard_stats: read access" ON dashboard_stats
  FOR SELECT USING (
    is_current_user_admin_role() OR 
    is_user_in_school(school_id)
  );