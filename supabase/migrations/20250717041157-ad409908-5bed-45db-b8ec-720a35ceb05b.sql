-- Remove all remaining email-related database triggers that bypass the unified processor

-- Drop triggers on email_queue table
DROP TRIGGER IF EXISTS email_queue_webhook_trigger ON public.email_queue;
DROP TRIGGER IF EXISTS trigger_email_webhook_trigger ON public.email_queue;

-- Drop triggers on tasks table
DROP TRIGGER IF EXISTS tasks_email_rules_insert_trigger ON public.tasks;
DROP TRIGGER IF EXISTS tasks_email_rules_update_trigger ON public.tasks;
DROP TRIGGER IF EXISTS tasks_email_trigger ON public.tasks;

-- Drop triggers on subtasks table  
DROP TRIGGER IF EXISTS subtasks_email_rules_insert_trigger ON public.subtasks;
DROP TRIGGER IF EXISTS subtasks_email_rules_update_trigger ON public.subtasks;

-- Add rate_limited status to email_queue_status enum
ALTER TYPE public.email_queue_status ADD VALUE IF NOT EXISTS 'rate_limited';

-- Update the email processing lock table to include more debugging info
ALTER TABLE public.email_processing_lock 
ADD COLUMN IF NOT EXISTS processor_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS last_error TEXT;