-- Add new dashboard widget-specific actions
INSERT INTO public.permission_actions (name, label, description, is_active, sort_order)
VALUES 
  ('view_stats_cadets', 'View Cadets Statistics', 'View cadet statistics widget on dashboard', true, 100),
  ('view_stats_tasks', 'View Tasks Statistics', 'View task statistics widget on dashboard', true, 101),
  ('view_stats_budget', 'View Budget Statistics', 'View budget statistics widget on dashboard', true, 102),
  ('view_stats_inventory', 'View Inventory Statistics', 'View inventory statistics widget on dashboard', true, 103),
  ('view_stats_incidents', 'View Incidents Statistics', 'View incident statistics widget on dashboard', true, 104),
  ('view_stats_schools', 'View Schools Statistics', 'View school statistics widget on dashboard', true, 105),
  ('view_my_tasks', 'View My Tasks Widget', 'View my tasks widget on dashboard', true, 106),
  ('view_my_cadets', 'View My Cadets Widget', 'View my cadets widget on dashboard', true, 107),
  ('view_upcoming_events', 'View Upcoming Events Widget', 'View upcoming events widget on dashboard', true, 108),
  ('view_quick_actions', 'View Quick Actions Widget', 'View quick actions widget on dashboard', true, 109),
  ('view_announcements_widget', 'View Announcements Widget', 'View announcements widget on dashboard', true, 110),
  ('view_mobile_features', 'View Mobile Features Widget', 'View mobile-specific widgets on dashboard', true, 111);