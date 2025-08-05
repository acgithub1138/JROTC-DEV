-- Disable email notification triggers by renaming them (keeps them for potential future use)
-- This prevents conflicts with application-level email handling

-- Disable task triggers
ALTER TRIGGER IF EXISTS trigger_task_email_notifications ON tasks RENAME TO trigger_task_email_notifications_disabled;

-- Disable subtask triggers  
ALTER TRIGGER IF EXISTS trigger_subtask_email_notifications ON subtasks RENAME TO trigger_subtask_email_notifications_disabled;