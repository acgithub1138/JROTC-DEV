
-- Update task_priority enum to match requirements
ALTER TYPE public.task_priority ADD VALUE IF NOT EXISTS 'critical';

-- Update task_status enum to match requirements  
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'not_started';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'working_on_it';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'stuck';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'done';

-- Create task_comments table for activity history and user comments
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text TEXT NOT NULL,
  is_system_comment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_comments
CREATE POLICY "Users can view comments for tasks in their school" ON public.task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t 
      WHERE t.id = task_id AND t.school_id = public.get_user_school_id()
    )
  );

CREATE POLICY "Users can insert comments for tasks in their school" ON public.task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t 
      WHERE t.id = task_id AND t.school_id = public.get_user_school_id()
    )
  );

-- Update tasks table RLS policies for role-based access
-- Instructors and command_staff can see all tasks in their school
-- Cadets can only see tasks assigned to them
DROP POLICY IF EXISTS "School data isolation" ON public.tasks;

CREATE POLICY "Instructors and command_staff can view all school tasks" ON public.tasks
  FOR SELECT USING (
    school_id = public.get_user_school_id() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'command_staff')
    )
  );

CREATE POLICY "Cadets can view tasks assigned to them" ON public.tasks
  FOR SELECT USING (
    school_id = public.get_user_school_id() AND
    assigned_to = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'cadet'
    )
  );

-- Instructors and command_staff can insert tasks
CREATE POLICY "Instructors and command_staff can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    school_id = public.get_user_school_id() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'command_staff')
    )
  );

-- Instructors and command_staff can update all tasks, cadets can update assigned tasks
CREATE POLICY "Instructors and command_staff can update all school tasks" ON public.tasks
  FOR UPDATE USING (
    school_id = public.get_user_school_id() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'command_staff')
    )
  );

CREATE POLICY "Cadets can update tasks assigned to them" ON public.tasks
  FOR UPDATE USING (
    school_id = public.get_user_school_id() AND
    assigned_to = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'cadet'
    )
  );

-- Only instructors and command_staff can delete tasks
CREATE POLICY "Instructors and command_staff can delete tasks" ON public.tasks
  FOR DELETE USING (
    school_id = public.get_user_school_id() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'command_staff')
    )
  );

-- Enable realtime for tasks and task_comments
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.task_comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
