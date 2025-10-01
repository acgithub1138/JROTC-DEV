-- Drop the existing check constraint
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_record_type_check;

-- Add the updated check constraint that includes 'event'
ALTER TABLE attachments ADD CONSTRAINT attachments_record_type_check 
CHECK (record_type IN ('task', 'subtask', 'incident', 'announcement', 'budget_transaction', 'event'));