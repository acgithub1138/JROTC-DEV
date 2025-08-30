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
  ('view_announcements', 'View Announcements Widget', 'View announcements widget on dashboard', true, 110),
  ('view_mobile_features', 'View Mobile Features Widget', 'View mobile-specific widgets on dashboard', true, 111)
ON CONFLICT (name) DO NOTHING;

-- Set default permissions for existing roles
-- Admin gets all dashboard widget permissions
INSERT INTO public.default_role_permissions (role_id, module_id, action_id, enabled)
SELECT 
  ur.id,
  pm.id,
  pa.id,
  true
FROM public.user_roles ur
CROSS JOIN public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE ur.role_name = 'admin'
  AND pm.name = 'dashboard'
  AND pa.name IN (
    'view_stats_cadets', 'view_stats_tasks', 'view_stats_budget', 
    'view_stats_inventory', 'view_stats_incidents', 'view_stats_schools',
    'view_my_tasks', 'view_my_cadets', 'view_upcoming_events',
    'view_quick_actions', 'view_announcements', 'view_mobile_features'
  )
ON CONFLICT (role_id, module_id, action_id) DO NOTHING;

-- Instructor gets most widgets except admin-specific ones
INSERT INTO public.default_role_permissions (role_id, module_id, action_id, enabled)
SELECT 
  ur.id,
  pm.id,
  pa.id,
  true
FROM public.user_roles ur
CROSS JOIN public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE ur.role_name = 'instructor'
  AND pm.name = 'dashboard'
  AND pa.name IN (
    'view_stats_cadets', 'view_stats_tasks', 'view_stats_budget', 
    'view_stats_inventory', 'view_stats_incidents',
    'view_my_tasks', 'view_upcoming_events',
    'view_quick_actions', 'view_announcements', 'view_mobile_features'
  )
ON CONFLICT (role_id, module_id, action_id) DO NOTHING;

-- Command Staff gets appropriate widgets
INSERT INTO public.default_role_permissions (role_id, module_id, action_id, enabled)
SELECT 
  ur.id,
  pm.id,
  pa.id,
  true
FROM public.user_roles ur
CROSS JOIN public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE ur.role_name = 'command_staff'
  AND pm.name = 'dashboard'
  AND pa.name IN (
    'view_stats_cadets', 'view_stats_tasks', 
    'view_my_tasks', 'view_upcoming_events',
    'view_quick_actions', 'view_announcements', 'view_mobile_features'
  )
ON CONFLICT (role_id, module_id, action_id) DO NOTHING;

-- Cadet gets limited widget set
INSERT INTO public.default_role_permissions (role_id, module_id, action_id, enabled)
SELECT 
  ur.id,
  pm.id,
  pa.id,
  true
FROM public.user_roles ur
CROSS JOIN public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE ur.role_name = 'cadet'
  AND pm.name = 'dashboard'
  AND pa.name IN (
    'view_my_tasks', 'view_upcoming_events',
    'view_announcements', 'view_mobile_features'
  )
ON CONFLICT (role_id, module_id, action_id) DO NOTHING;

-- Parent gets parent-specific widgets
INSERT INTO public.default_role_permissions (role_id, module_id, action_id, enabled)
SELECT 
  ur.id,
  pm.id,
  pa.id,
  true
FROM public.user_roles ur
CROSS JOIN public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE ur.role_name = 'parent'
  AND pm.name = 'dashboard'
  AND pa.name IN (
    'view_my_cadets', 'view_upcoming_events',
    'view_announcements', 'view_mobile_features'
  )
ON CONFLICT (role_id, module_id, action_id) DO NOTHING;