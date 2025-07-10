-- Create permission management tables
CREATE TABLE public.permission_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.permission_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.user_role NOT NULL,
  module_id UUID NOT NULL REFERENCES public.permission_modules(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.permission_actions(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, module_id, action_id)
);

CREATE TABLE public.default_role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.user_role NOT NULL,
  module_id UUID NOT NULL REFERENCES public.permission_modules(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.permission_actions(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, module_id, action_id)
);

-- Enable RLS
ALTER TABLE public.permission_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.default_role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permission_modules
CREATE POLICY "Everyone can view permission modules" 
  ON public.permission_modules FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage permission modules" 
  ON public.permission_modules FOR ALL 
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies for permission_actions
CREATE POLICY "Everyone can view permission actions" 
  ON public.permission_actions FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage permission actions" 
  ON public.permission_actions FOR ALL 
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies for role_permissions
CREATE POLICY "Everyone can view role permissions" 
  ON public.role_permissions FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage role permissions" 
  ON public.role_permissions FOR ALL 
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies for default_role_permissions
CREATE POLICY "Everyone can view default role permissions" 
  ON public.default_role_permissions FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage default role permissions" 
  ON public.default_role_permissions FOR ALL 
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
  user_id UUID,
  module_name TEXT,
  action_name TEXT
) RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT rp.enabled
      FROM public.role_permissions rp
      JOIN public.permission_modules pm ON rp.module_id = pm.id
      JOIN public.permission_actions pa ON rp.action_id = pa.id
      JOIN public.profiles p ON p.role = rp.role
      WHERE p.id = user_id
        AND pm.name = module_name
        AND pa.name = action_name
    ),
    false
  );
$$;

-- Insert permission modules
INSERT INTO public.permission_modules (name, label, description) VALUES
  ('cadets', 'Cadets', 'Cadet profile management'),
  ('tasks', 'Cadet Tasks', 'Task management and assignment'),
  ('job_board', 'Job Board', 'Job board and organizational chart'),
  ('teams', 'Teams', 'Team management and assignments'),
  ('budget', 'Budget', 'Budget and financial management'),
  ('inventory', 'Inventory', 'Inventory and equipment management'),
  ('contacts', 'Contacts', 'Contact management'),
  ('calendar', 'Calendar', 'Calendar and event management'),
  ('competitions', 'Competitions', 'Competition management'),
  ('email', 'Email', 'Email management and templates'),
  ('incidents', 'Incident Management', 'Incident tracking and management');

-- Insert permission actions
INSERT INTO public.permission_actions (name, label, description) VALUES
  ('view', 'View', 'Can view the module'),
  ('create', 'Create', 'Can create new records'),
  ('read', 'Read', 'Can read/view records'),
  ('update', 'Update', 'Can update existing records'),
  ('delete', 'Delete', 'Can delete records'),
  ('sidebar', 'Sidebar Link', 'Can see module in sidebar navigation');

-- Insert default permissions based on current system
-- Admin permissions (full access to everything)
INSERT INTO public.default_role_permissions (role, module_id, action_id, enabled)
SELECT 'admin'::public.user_role, pm.id, pa.id, true
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa;

-- Instructor permissions
INSERT INTO public.default_role_permissions (role, module_id, action_id, enabled)
SELECT 'instructor'::public.user_role, pm.id, pa.id, true
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name IN ('cadets', 'tasks', 'job_board', 'teams', 'budget', 'inventory', 'contacts', 'calendar', 'competitions', 'email');

-- Command Staff permissions
INSERT INTO public.default_role_permissions (role, module_id, action_id, enabled)
SELECT 'command_staff'::public.user_role, pm.id, pa.id, 
  CASE 
    WHEN pm.name IN ('competitions') AND pa.name IN ('create', 'update', 'delete') THEN false
    WHEN pm.name IN ('cadets', 'tasks', 'job_board', 'teams', 'inventory', 'contacts', 'calendar', 'competitions') THEN true
    ELSE false
  END
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name IN ('cadets', 'tasks', 'job_board', 'teams', 'inventory', 'contacts', 'calendar', 'competitions');

-- Cadet permissions (very limited)
INSERT INTO public.default_role_permissions (role, module_id, action_id, enabled)
SELECT 'cadet'::public.user_role, pm.id, pa.id, 
  CASE 
    WHEN pm.name IN ('tasks', 'job_board', 'teams', 'calendar', 'competitions') AND pa.name IN ('view', 'read', 'sidebar') THEN true
    ELSE false
  END
FROM public.permission_modules pm
CROSS JOIN public.permission_actions pa
WHERE pm.name IN ('tasks', 'job_board', 'teams', 'calendar', 'competitions');

-- Copy default permissions to role_permissions
INSERT INTO public.role_permissions (role, module_id, action_id, enabled)
SELECT role, module_id, action_id, enabled
FROM public.default_role_permissions;

-- Create trigger to update timestamps
CREATE TRIGGER update_permission_modules_updated_at
  BEFORE UPDATE ON public.permission_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_permission_actions_updated_at
  BEFORE UPDATE ON public.permission_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();