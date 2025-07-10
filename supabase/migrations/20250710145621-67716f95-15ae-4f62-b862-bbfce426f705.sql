-- Create subtask_comments table similar to task_comments
CREATE TABLE public.subtask_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subtask_id uuid NOT NULL REFERENCES public.subtasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  is_system_comment boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subtask_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subtask_comments
CREATE POLICY "Users can create subtask comments on subtasks from their school" ON public.subtask_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM subtasks 
    WHERE subtasks.id = subtask_comments.subtask_id 
    AND subtasks.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "Users can view subtask comments on subtasks from their school" ON public.subtask_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subtasks 
    WHERE subtasks.id = subtask_comments.subtask_id 
    AND subtasks.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "Users can update their own subtask comments on subtasks from their school" ON public.subtask_comments
FOR UPDATE
USING (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM subtasks 
    WHERE subtasks.id = subtask_comments.subtask_id 
    AND subtasks.school_id = get_current_user_school_id()
  )
);

CREATE POLICY "Users can delete their own subtask comments on subtasks from their school" ON public.subtask_comments
FOR DELETE
USING (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM subtasks 
    WHERE subtasks.id = subtask_comments.subtask_id 
    AND subtasks.school_id = get_current_user_school_id()
  )
);

-- Create an index for better performance
CREATE INDEX idx_subtask_comments_subtask_id ON public.subtask_comments(subtask_id);
CREATE INDEX idx_subtask_comments_created_at ON public.subtask_comments(created_at DESC);