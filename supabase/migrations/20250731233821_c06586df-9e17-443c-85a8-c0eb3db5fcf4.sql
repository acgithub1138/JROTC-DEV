-- Add new modules for the competition portal tables
INSERT INTO public.permission_modules (name, label, description) VALUES
('cp_comp_schools', 'Competition Schools', 'School registration management for competitions'),
('cp_comp_events', 'Competition Events', 'Event management within competitions'),
('cp_comp_resources', 'Competition Resources', 'Resource assignment management for competitions');