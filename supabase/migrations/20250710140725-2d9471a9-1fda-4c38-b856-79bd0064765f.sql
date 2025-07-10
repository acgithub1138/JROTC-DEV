-- Create subtasks table based on tasks table structure
CREATE TABLE public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_task_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID NULL,
  assigned_by UUID NULL,
  due_date TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  school_id UUID NOT NULL,
  team_id UUID NULL,
  task_number TEXT NULL
);

-- Add foreign key constraint to parent task
ALTER TABLE public.subtasks 
ADD CONSTRAINT subtasks_parent_task_id_fkey 
FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Add foreign key constraints similar to tasks table
ALTER TABLE public.subtasks 
ADD CONSTRAINT subtasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);

ALTER TABLE public.subtasks 
ADD CONSTRAINT subtasks_assigned_by_fkey 
FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);

ALTER TABLE public.subtasks 
ADD CONSTRAINT subtasks_school_id_fkey 
FOREIGN KEY (school_id) REFERENCES public.schools(id);

-- Create sequence for subtask numbers
CREATE SEQUENCE IF NOT EXISTS subtask_number_seq START 1;

-- Create function to generate subtask numbers
CREATE OR REPLACE FUNCTION public.generate_subtask_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('subtask_number_seq') INTO next_num;
    RETURN 'STSK' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Create trigger function to assign subtask numbers
CREATE OR REPLACE FUNCTION public.assign_subtask_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := generate_subtask_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for auto-assigning subtask numbers
CREATE TRIGGER subtasks_assign_number_trigger
    BEFORE INSERT ON public.subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_subtask_number();

-- Create trigger for updated_at timestamp
CREATE TRIGGER subtasks_updated_at_trigger
    BEFORE UPDATE ON public.subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subtasks (similar to tasks)
CREATE POLICY "Users can view subtasks from their school" 
ON public.subtasks 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Users can create subtasks for their school" 
ON public.subtasks 
FOR INSERT 
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Users can update subtasks from their school" 
ON public.subtasks 
FOR UPDATE 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Users can delete subtasks from their school" 
ON public.subtasks 
FOR DELETE 
USING (school_id = get_current_user_school_id());

-- Add validation functions for subtasks (reuse existing task validation)
-- These will work because subtasks use the same status and priority values

-- Create indexes for better performance
CREATE INDEX idx_subtasks_parent_task_id ON public.subtasks(parent_task_id);
CREATE INDEX idx_subtasks_school_id ON public.subtasks(school_id);
CREATE INDEX idx_subtasks_assigned_to ON public.subtasks(assigned_to);
CREATE INDEX idx_subtasks_status ON public.subtasks(status);
CREATE INDEX idx_subtasks_due_date ON public.subtasks(due_date);