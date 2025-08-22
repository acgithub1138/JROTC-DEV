-- Update paths for modules that are tabs or sub-components
UPDATE permission_modules SET 
  path = CASE 
    -- Competition Portal modules (tabs within competition portal)
    WHEN name = 'cp_competitions' THEN '/app/competition-portal/competitions'
    WHEN name = 'cp_events' THEN '/app/competition-portal/events' 
    WHEN name = 'cp_judges' THEN '/app/competition-portal/judges'
    WHEN name = 'cp_comp_events' THEN '/app/competition-portal/competitions' -- Tab within competitions
    WHEN name = 'cp_comp_resources' THEN '/app/competition-portal/resources' 
    WHEN name = 'cp_comp_schools' THEN '/app/competition-portal/competitions' -- Tab within competitions
    WHEN name = 'cp_schedules' THEN '/app/competition-portal/schedules'
    
    -- Main CCC modules
    WHEN name = 'job_board' THEN '/app/job-board'
    WHEN name = 'teams' THEN '/app/teams'
    WHEN name = 'inventory' THEN '/app/inventory'
    WHEN name = 'incident_management' THEN '/app/incidents'
    
    -- Keep existing paths
    ELSE path
  END,
  
  -- Update competition portal flags
  is_competition_portal = CASE 
    WHEN name IN ('cp_competitions', 'cp_events', 'cp_judges', 'cp_comp_events', 'cp_comp_resources', 'cp_comp_schools', 'cp_schedules') THEN true
    ELSE is_competition_portal
  END

WHERE name IN (
  'cp_competitions', 'cp_events', 'cp_judges', 'cp_comp_events', 'cp_comp_resources', 
  'cp_comp_schools', 'cp_schedules', 'job_board', 'teams', 'inventory', 'incident_management'
);