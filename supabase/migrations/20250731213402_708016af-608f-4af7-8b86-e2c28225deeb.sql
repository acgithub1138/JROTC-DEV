-- Add Competition Portal permission modules
INSERT INTO public.permission_modules (name, label, description)
VALUES 
  ('cp_competitions', 'Competitions', 'Competition management for competition portal'),
  ('cp_events', 'Events', 'Event management for competition portal'),
  ('cp_judges', 'Judges', 'Judge management for competition portal');

-- Add default role permissions for cp_competitions module
INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'admin' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name = 'cp_competitions';

INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'instructor' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name = 'cp_competitions';

INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'command_staff' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name = 'cp_competitions';

-- Add default role permissions for cp_events module
INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'admin' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name = 'cp_events';

INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'instructor' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name = 'cp_events';

INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'command_staff' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name = 'cp_events';

-- Add default role permissions for cp_judges module
INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'admin' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name = 'cp_judges';

INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'instructor' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name = 'cp_judges';

INSERT INTO public.default_role_permissions (module_id, action_id, role, enabled)
SELECT 
  pm.id as module_id,
  pa.id as action_id,
  'command_staff' as role,
  true as enabled
FROM public.permission_modules pm
CROSS JOIN public.permission_actions PA
WHERE pm.name = 'cp_judges';