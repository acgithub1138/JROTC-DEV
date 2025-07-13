-- Remove email rules system and triggers

-- Drop all email rule triggers
DROP TRIGGER IF EXISTS tasks_email_trigger ON public.tasks;
DROP TRIGGER IF EXISTS cadets_email_trigger ON public.cadets;
DROP TRIGGER IF EXISTS contacts_email_trigger ON public.contacts;
DROP TRIGGER IF EXISTS expenses_email_trigger ON public.expenses;
DROP TRIGGER IF EXISTS incidents_email_trigger ON public.incidents;

-- Drop the email rules processing function
DROP FUNCTION IF EXISTS public.process_email_rules();

-- Keep email_queue and email_templates tables for manual notifications
-- Just remove the email_rules table and related logs
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.email_rules CASCADE;