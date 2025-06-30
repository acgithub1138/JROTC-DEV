
-- Drop all business rule triggers from tasks table
DROP TRIGGER IF EXISTS business_rules_trigger_insert ON tasks;
DROP TRIGGER IF EXISTS business_rules_trigger_update ON tasks;
DROP TRIGGER IF EXISTS business_rules_trigger_delete ON tasks;

-- Drop the business rules execution function
DROP FUNCTION IF EXISTS execute_business_rules();

-- Drop the business rule logs table
DROP TABLE IF EXISTS public.business_rule_logs CASCADE;

-- Drop the business rules table
DROP TABLE IF EXISTS public.business_rules CASCADE;

-- Remove business rules entries from schema tracking
DELETE FROM public.schema_tracking 
WHERE table_name IN ('business_rules', 'business_rule_logs');
