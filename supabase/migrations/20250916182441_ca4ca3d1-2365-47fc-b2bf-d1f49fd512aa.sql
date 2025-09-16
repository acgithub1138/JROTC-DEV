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
            'position', tm.position,
            'created_at', tm.created_at
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

-- Create view for dashboard statistics (pre-calculated aggregates)
CREATE OR REPLACE VIEW dashboard_stats AS
WITH current_school_year AS (
  SELECT 
    CASE 
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8 
      THEN EXTRACT(YEAR FROM CURRENT_DATE)::text || '-08-01'
      ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::text || '-08-01'
    END as year_start,
    CASE 
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8 
      THEN (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::text || '-06-30'
      ELSE EXTRACT(YEAR FROM CURRENT_DATE)::text || '-06-30'
    END as year_end
),
cadet_stats AS (
  SELECT 
    school_id,
    COUNT(*) as total_cadets
  FROM profiles 
  WHERE role != 'instructor' AND active = true
  GROUP BY school_id
),
task_stats AS (
  SELECT 
    school_id,
    COUNT(*) as active_tasks,
    COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as overdue_tasks
  FROM tasks 
  WHERE status != 'completed'
  GROUP BY school_id
),
budget_stats AS (
  SELECT 
    school_id,
    SUM(CASE WHEN category = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN category = 'expense' THEN amount ELSE 0 END) as total_expenses
  FROM budget_transactions 
  WHERE archive = false AND active = true
  GROUP BY school_id
),
inventory_stats AS (
  SELECT 
    school_id,
    COUNT(*) as total_items,
    SUM(qty_issued) as total_issued,
    COUNT(CASE WHEN qty_available > 0 THEN 1 END) as in_stock_count,
    COUNT(CASE WHEN qty_available = 0 THEN 1 END) as out_of_stock_count
  FROM inventory_items
  GROUP BY school_id
),
incident_stats AS (
  SELECT 
    school_id,
    COUNT(CASE WHEN status NOT IN ('resolved', 'canceled') THEN 1 END) as active_incidents,
    COUNT(CASE WHEN created_at < CURRENT_DATE - INTERVAL '7 days' 
                AND status NOT IN ('resolved', 'canceled') THEN 1 END) as overdue_incidents,
    COUNT(CASE WHEN priority IN ('urgent', 'critical') 
                AND status NOT IN ('resolved', 'canceled') THEN 1 END) as urgent_critical_incidents
  FROM incidents
  GROUP BY school_id
),
community_service_stats AS (
  SELECT 
    p.school_id,
    p.id as cadet_id,
    SUM(cs.hours) as total_hours,
    COUNT(cs.id) as total_records
  FROM community_service cs
  JOIN profiles p ON cs.cadet_id = p.id
  CROSS JOIN current_school_year sy
  WHERE cs.date >= sy.year_start::date 
    AND cs.date <= sy.year_end::date
  GROUP BY p.school_id, p.id
)
SELECT 
  COALESCE(cs.school_id, ts.school_id, bs.school_id, is.school_id, ins.school_id) as school_id,
  COALESCE(cs.total_cadets, 0) as total_cadets,
  COALESCE(ts.active_tasks, 0) as active_tasks,
  COALESCE(ts.overdue_tasks, 0) as overdue_tasks,
  COALESCE(bs.total_income, 0) as total_income,
  COALESCE(bs.total_expenses, 0) as total_expenses,
  COALESCE(bs.total_income, 0) - COALESCE(bs.total_expenses, 0) as net_budget,
  COALESCE(is.total_items, 0) as total_inventory,
  COALESCE(is.total_issued, 0) as total_issued,
  COALESCE(is.in_stock_count, 0) as in_stock_count,
  COALESCE(is.out_of_stock_count, 0) as out_of_stock_count,
  COALESCE(ins.active_incidents, 0) as active_incidents,
  COALESCE(ins.overdue_incidents, 0) as overdue_incidents,
  COALESCE(ins.urgent_critical_incidents, 0) as urgent_critical_incidents,
  COALESCE(SUM(css.total_hours), 0) as community_service_hours,
  COALESCE(SUM(css.total_records), 0) as community_service_records
FROM cadet_stats cs
FULL OUTER JOIN task_stats ts ON cs.school_id = ts.school_id
FULL OUTER JOIN budget_stats bs ON COALESCE(cs.school_id, ts.school_id) = bs.school_id
FULL OUTER JOIN inventory_stats is ON COALESCE(cs.school_id, ts.school_id, bs.school_id) = is.school_id
FULL OUTER JOIN incident_stats ins ON COALESCE(cs.school_id, ts.school_id, bs.school_id, is.school_id) = ins.school_id
LEFT JOIN community_service_stats css ON COALESCE(cs.school_id, ts.school_id, bs.school_id, is.school_id, ins.school_id) = css.school_id
GROUP BY 
  COALESCE(cs.school_id, ts.school_id, bs.school_id, is.school_id, ins.school_id),
  cs.total_cadets, ts.active_tasks, ts.overdue_tasks,
  bs.total_income, bs.total_expenses, is.total_items, is.total_issued,
  is.in_stock_count, is.out_of_stock_count, ins.active_incidents,
  ins.overdue_incidents, ins.urgent_critical_incidents;