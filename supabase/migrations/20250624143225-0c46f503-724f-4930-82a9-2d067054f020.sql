
-- Step 1: Add the new enum values (this needs to be committed before use)
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'canceled';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'in_progress'; 
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'overdue';
ALTER TYPE public.task_priority ADD VALUE IF NOT EXISTS 'urgent';
