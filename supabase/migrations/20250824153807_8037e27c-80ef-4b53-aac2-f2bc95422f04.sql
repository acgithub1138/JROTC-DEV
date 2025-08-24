-- Drop the existing check constraint
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS attachments_record_type_check;

-- Add the new check constraint that includes 'announcement'
ALTER TABLE public.attachments ADD CONSTRAINT attachments_record_type_check 
CHECK (record_type IN ('task', 'subtask', 'incident', 'announcement'));