-- Check the current RLS policies for task_comments table
-- The issue is that the current policy only allows comments on tasks from the same school
-- but it doesn't account for subtasks which reference the parent task

-- Update the RLS policy to allow comments on subtasks as well
DROP POLICY IF EXISTS "Users can create task comments on tasks from their school" ON task_comments;

-- Create a new policy that handles both tasks and subtasks
CREATE POLICY "Users can create task comments on tasks from their school" ON task_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_comments.task_id 
    AND tasks.school_id = get_current_user_school_id()
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM subtasks 
    WHERE subtasks.id = task_comments.task_id 
    AND subtasks.school_id = get_current_user_school_id()
  )
);

-- Also update the select policy to include subtasks
DROP POLICY IF EXISTS "Users can view task comments on tasks from their school" ON task_comments;

CREATE POLICY "Users can view task comments on tasks from their school" ON task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_comments.task_id 
    AND tasks.school_id = get_current_user_school_id()
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM subtasks 
    WHERE subtasks.id = task_comments.task_id 
    AND subtasks.school_id = get_current_user_school_id()
  )
);

-- Update the update policy to include subtasks
DROP POLICY IF EXISTS "Users can update their own task comments on tasks from their sc" ON task_comments;

CREATE POLICY "Users can update their own task comments on tasks from their school" ON task_comments
FOR UPDATE
USING (
  user_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.school_id = get_current_user_school_id()
    ) 
    OR 
    EXISTS (
      SELECT 1 FROM subtasks 
      WHERE subtasks.id = task_comments.task_id 
      AND subtasks.school_id = get_current_user_school_id()
    )
  )
);

-- Update the delete policy to include subtasks  
DROP POLICY IF EXISTS "Users can delete their own task comments on tasks from their sc" ON task_comments;

CREATE POLICY "Users can delete their own task comments on tasks from their school" ON task_comments
FOR DELETE
USING (
  user_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.school_id = get_current_user_school_id()
    ) 
    OR 
    EXISTS (
      SELECT 1 FROM subtasks 
      WHERE subtasks.id = task_comments.task_id 
      AND subtasks.school_id = get_current_user_school_id()
    )
  )
);