-- Add incident management menu item for admins
INSERT INTO sidebar_preferences (user_id, menu_item_id, label, icon, sort_order, is_visible, created_by_system)
SELECT 
  p.id as user_id,
  'incidents' as menu_item_id,
  'Incident Management' as label,
  'AlertTriangle' as icon,
  11 as sort_order,
  true as is_visible,
  true as created_by_system
FROM profiles p 
WHERE p.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM sidebar_preferences sp 
  WHERE sp.user_id = p.id AND sp.menu_item_id = 'incidents'
);