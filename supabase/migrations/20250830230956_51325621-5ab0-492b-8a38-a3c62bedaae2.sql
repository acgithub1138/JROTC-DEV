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
    'view_quick_actions', 'view_announcements_widget', 'view_mobile_features'
  );

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
    'view_quick_actions', 'view_announcements_widget', 'view_mobile_features'
  );

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
    'view_quick_actions', 'view_announcements_widget', 'view_mobile_features'
  );

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
    'view_announcements_widget', 'view_mobile_features'
  );

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
    'view_announcements_widget', 'view_mobile_features'
  );