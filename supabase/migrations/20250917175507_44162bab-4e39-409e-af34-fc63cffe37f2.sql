-- Create email rule for competition registration confirmation
-- This will be created for each school that needs it
INSERT INTO email_rules (school_id, rule_type, template_id, is_active, trigger_event)
SELECT 
    s.id as school_id,
    'comp_registration_confirmation' as rule_type,
    '6e864f13-5861-4b2b-bec2-144178155ce8' as template_id,
    false as is_active, -- Start inactive so schools can configure it
    'INSERT' as trigger_event
FROM schools s
WHERE s.name != 'Carey Unlimited'
ON CONFLICT (school_id, rule_type) DO UPDATE SET
    template_id = EXCLUDED.template_id,
    updated_at = now();