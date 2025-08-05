-- Drop all existing policies for task_comments to clean up conflicts
DROP POLICY IF EXISTS "Users can create task comments on tasks from their school" ON public.task_comments;
DROP POLICY IF EXISTS "Users can insert comments for tasks in their school" ON public.task_comments;
DROP POLICY IF EXISTS "Users can delete their own task comments on tasks from their sc" ON public.task_comments;
DROP POLICY IF EXISTS "Users can update their own task comments on tasks from their sc" ON public.task_comments;
DROP POLICY IF EXISTS "Users can view comments for tasks in their school" ON public.task_comments;
DROP POLICY IF EXISTS "Users can view task comments from their school" ON public.task_comments;
DROP POLICY IF EXISTS "Users can view task comments on tasks from their school" ON public.task_comments;

-- Create consistent policies for task_comments
CREATE POLICY "Users can view task comments from their school" 
ON public.task_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tasks t 
  WHERE t.id = task_comments.task_id 
  AND t.school_id = get_current_user_school_id()
));

CREATE POLICY "Users can insert task comments in their school" 
ON public.task_comments 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id = task_comments.task_id 
    AND t.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "Users can update their own task comments" 
ON public.task_comments 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id = task_comments.task_id 
    AND t.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "Users can delete their own task comments" 
ON public.task_comments 
FOR DELETE 
USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id = task_comments.task_id 
    AND t.school_id = get_current_user_school_id()
  )
);