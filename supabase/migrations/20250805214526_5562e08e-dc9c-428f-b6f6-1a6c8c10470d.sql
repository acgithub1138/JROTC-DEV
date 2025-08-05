-- Disable email notification triggers by dropping them (keeps them for potential future use via comments)
-- This prevents conflicts with application-level email handling

-- Drop task triggers
DROP TRIGGER IF EXISTS trigger_task_email_notifications ON tasks;

-- Drop subtask triggers  
DROP TRIGGER IF EXISTS trigger_subtask_email_notifications ON subtasks;

-- Keep the trigger function for potential future re-enabling
-- To re-enable in the future, run:
-- CREATE TRIGGER trigger_task_email_notifications
--   AFTER INSERT OR UPDATE ON tasks
--   FOR EACH ROW EXECUTE FUNCTION process_email_rules();
-- 
-- CREATE TRIGGER trigger_subtask_email_notifications 
--   AFTER INSERT OR UPDATE ON subtasks
--   FOR EACH ROW EXECUTE FUNCTION process_email_rules();