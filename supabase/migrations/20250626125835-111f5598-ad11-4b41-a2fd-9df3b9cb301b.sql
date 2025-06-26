
-- Remove all workflow-related tables and their dependencies
DROP TABLE IF EXISTS public.workflow_variables CASCADE;
DROP TABLE IF EXISTS public.workflow_executions CASCADE; 
DROP TABLE IF EXISTS public.workflow_connections CASCADE;
DROP TABLE IF EXISTS public.workflow_nodes CASCADE;
DROP TABLE IF EXISTS public.workflows CASCADE;

-- Remove any sequences that might have been created for workflows
DROP SEQUENCE IF EXISTS workflow_number_seq CASCADE;
