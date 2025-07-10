-- Revert task_comments RLS policies back to original state (tasks only)
-- since we now have a dedicated subtask_comments table

DROP POLICY IF EXISTS "Users can create task comments on tasks from their school" ON task_comments;
DROP POLICY IF EXISTS "Users can view task comments on tasks from their school" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own task comments on tasks from their school" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own task comments on tasks from their school" ON task_comments;

-- Recreate the original policies for tasks only
CREATE POLICY "Users can create task comments on tasks from their school" ON task_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_comments.task_id 
    AND tasks.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "Users can view task comments on tasks from their school" ON task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_comments.task_id 
    AND tasks.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "Users can update their own task comments on tasks from their school" ON task_comments
FOR UPDATE
USING (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_comments.task_id 
    AND tasks.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "Users can delete their own task comments on tasks from their school" ON task_comments
FOR DELETE
USING (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_comments.task_id 
    AND tasks.school_id = get_current_user_school_id()
  )
);