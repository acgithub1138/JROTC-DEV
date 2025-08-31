-- Add community service hours widget action to permission_actions table
INSERT INTO public.permission_actions (name, label, description, is_active, created_at, updated_at)
VALUES (
  'view_stats_community_service',
  'View Community Service Statistics',
  'Permission to view community service hours statistics widget on dashboard',
  true,
  now(),
  now()
)
ON CONFLICT (name) DO NOTHING;