-- Add missing columns to permission_modules
ALTER TABLE permission_modules 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'FileText',
ADD COLUMN IF NOT EXISTS path TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_competition_portal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add missing columns to permission_actions
ALTER TABLE permission_actions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing modules with default values
UPDATE permission_modules 
SET 
    icon = CASE 
        WHEN name = 'Dashboard' THEN 'Home'
        WHEN name = 'Calendar' THEN 'Calendar'
        WHEN name = 'Cadets' THEN 'Users'
        WHEN name = 'Budget' THEN 'BarChart3'
        WHEN name = 'Tasks' THEN 'FileText'
        WHEN name = 'Job Board' THEN 'Clipboard'
        WHEN name = 'Contacts' THEN 'Users'
        WHEN name = 'Incidents' THEN 'Shield'
        WHEN name = 'Competitions' THEN 'Trophy'
        WHEN name = 'Email' THEN 'Mail'
        WHEN name = 'Events' THEN 'Calendar'
        WHEN name = 'Judges' THEN 'Shield'
        ELSE 'FileText'
    END,
    path = CASE 
        WHEN name = 'Dashboard' THEN '/app/dashboard'
        WHEN name = 'Calendar' THEN '/app/calendar'
        WHEN name = 'Cadets' THEN '/app/cadets'
        WHEN name = 'Budget' THEN '/app/budget'
        WHEN name = 'Tasks' THEN '/app/tasks'
        WHEN name = 'Job Board' THEN '/app/job-board'
        WHEN name = 'Contacts' THEN '/app/contacts'
        WHEN name = 'Incidents' THEN '/app/incidents'
        WHEN name = 'Competitions' THEN '/app/competition-portal/competitions'
        WHEN name = 'Email' THEN '/app/email'
        WHEN name = 'Events' THEN '/app/competition-portal/events'
        WHEN name = 'Judges' THEN '/app/competition-portal/judges'
        ELSE NULL
    END,
    is_competition_portal = CASE 
        WHEN name IN ('Competitions', 'Events', 'Judges') THEN true
        ELSE false
    END,
    sort_order = CASE 
        WHEN name = 'Dashboard' THEN 1
        WHEN name = 'Calendar' THEN 2
        WHEN name = 'Cadets' THEN 3
        WHEN name = 'Tasks' THEN 4
        WHEN name = 'Job Board' THEN 5
        WHEN name = 'Budget' THEN 6
        WHEN name = 'Contacts' THEN 7
        WHEN name = 'Incidents' THEN 8
        WHEN name = 'Email' THEN 9
        WHEN name = 'Competitions' THEN 10
        WHEN name = 'Events' THEN 11
        WHEN name = 'Judges' THEN 12
        ELSE 99
    END
WHERE icon IS NULL OR path IS NULL OR sort_order IS NULL OR is_competition_portal IS NULL;