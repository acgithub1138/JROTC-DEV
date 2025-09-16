-- Create view for teams with members and lead information
CREATE OR REPLACE VIEW teams_with_members AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.team_lead_id,
  t.school_id,
  t.created_at,
  t.updated_at,
  -- Team lead information
  lead.first_name as team_lead_first_name,
  lead.last_name as team_lead_last_name,
  lead.email as team_lead_email,
  -- Member count
  COALESCE(member_counts.member_count, 0) as member_count,
  -- Member details as JSON array
  COALESCE(
    json_agg(
      CASE 
        WHEN tm.id IS NOT NULL THEN
          json_build_object(
            'id', tm.id,
            'team_id', tm.team_id,
            'cadet_id', tm.cadet_id,
            'role', tm.role,
            'joined_at', tm.joined_at
          )
        ELSE NULL
      END
    ) FILTER (WHERE tm.id IS NOT NULL),
    '[]'::json
  ) as team_members
FROM teams t
LEFT JOIN profiles lead ON t.team_lead_id = lead.id
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN (
  SELECT team_id, COUNT(*) as member_count
  FROM team_members
  GROUP BY team_id
) member_counts ON t.id = member_counts.team_id
GROUP BY 
  t.id, t.name, t.description, t.team_lead_id, t.school_id, t.created_at, t.updated_at,
  lead.first_name, lead.last_name, lead.email, member_counts.member_count;

-- Create view for parent cadet tasks (eliminates complex loops)
CREATE OR REPLACE VIEW parent_cadet_tasks AS
SELECT 
  'task' as task_type,
  t.id,
  t.task_number,
  t.title,
  t.status,
  t.priority,
  t.due_date,
  t.assigned_to as cadet_id,
  p.first_name || ' ' || p.last_name as cadet_name,
  c.email as parent_email,
  FALSE as is_subtask,
  NULL as parent_task_title,
  t.school_id
FROM tasks t
JOIN profiles p ON t.assigned_to = p.id
JOIN contacts c ON p.id = c.cadet_id AND c.type = 'parent'
WHERE t.status NOT IN ('completed', 'cancelled')

UNION ALL

SELECT 
  'subtask' as task_type,
  st.id,
  st.task_number,
  st.title,
  st.status,
  st.priority,
  st.due_date,
  st.assigned_to as cadet_id,
  p.first_name || ' ' || p.last_name as cadet_name,
  c.email as parent_email,
  TRUE as is_subtask,
  'Subtask' as parent_task_title,
  st.school_id
FROM subtasks st
JOIN profiles p ON st.assigned_to = p.id
JOIN contacts c ON p.id = c.cadet_id AND c.type = 'parent'
WHERE st.status NOT IN ('completed', 'cancelled');

-- Create simplified dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  school_id,
  -- Cadet counts
  COUNT(CASE WHEN role != 'instructor' AND active = true THEN 1 END) as total_cadets,
  -- Task counts (will be joined separately)
  0 as active_tasks,
  0 as overdue_tasks,
  -- Budget totals (will be joined separately) 
  0 as total_income,
  0 as total_expenses,
  0 as net_budget,
  -- Inventory counts (will be joined separately)
  0 as total_inventory,
  0 as total_issued,
  0 as in_stock_count,
  0 as out_of_stock_count,
  -- Incident counts (will be joined separately)
  0 as active_incidents,
  0 as overdue_incidents,
  0 as urgent_critical_incidents,
  -- Community service totals (will be joined separately)
  0 as community_service_hours,
  0 as community_service_records
FROM profiles
WHERE school_id IS NOT NULL
GROUP BY school_id;