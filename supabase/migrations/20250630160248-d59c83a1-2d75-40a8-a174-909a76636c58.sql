
-- Add remaining RLS policies that don't already exist

-- Enable RLS on business_rule_logs table
ALTER TABLE public.business_rule_logs ENABLE ROW LEVEL SECURITY;

-- Business rule logs policies
CREATE POLICY "Users can view business rule logs from their school" 
  ON public.business_rule_logs 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

-- Enable RLS on tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view tasks from their school" 
  ON public.tasks 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can create tasks for their school" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can update tasks from their school" 
  ON public.tasks 
  FOR UPDATE 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can delete tasks from their school" 
  ON public.tasks 
  FOR DELETE 
  USING (school_id = public.get_current_user_school_id());

-- Enable RLS on task_comments table
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Task comments policies - users can only see comments on tasks from their school
CREATE POLICY "Users can view task comments from their school" 
  ON public.task_comments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.school_id = public.get_current_user_school_id()
    )
  );

CREATE POLICY "Users can create task comments on tasks from their school" 
  ON public.task_comments 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.school_id = public.get_current_user_school_id()
    )
  );

CREATE POLICY "Users can update their own task comments on tasks from their school" 
  ON public.task_comments 
  FOR UPDATE 
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.school_id = public.get_current_user_school_id()
    )
  );

CREATE POLICY "Users can delete their own task comments on tasks from their school" 
  ON public.task_comments 
  FOR DELETE 
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.id = task_comments.task_id 
      AND tasks.school_id = public.get_current_user_school_id()
    )
  );

-- Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams from their school" 
  ON public.teams 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can create teams for their school" 
  ON public.teams 
  FOR INSERT 
  WITH CHECK (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can update teams from their school" 
  ON public.teams 
  FOR UPDATE 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can delete teams from their school" 
  ON public.teams 
  FOR DELETE 
  USING (school_id = public.get_current_user_school_id());

-- Enable RLS on other school-specific tables (skip profiles as it already has some policies)
ALTER TABLE public.cadets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Cadets policies
CREATE POLICY "Users can view cadets from their school" 
  ON public.cadets 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors and admins can manage cadets in their school" 
  ON public.cadets 
  FOR ALL 
  USING (
    public.get_current_user_role() IN ('admin', 'instructor', 'command_staff') AND 
    school_id = public.get_current_user_school_id()
  );

-- Contacts policies
CREATE POLICY "Users can view contacts from their school" 
  ON public.contacts 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can manage contacts in their school" 
  ON public.contacts 
  FOR ALL 
  USING (school_id = public.get_current_user_school_id());

-- Budget policies
CREATE POLICY "Users can view budget from their school" 
  ON public.budget 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Admins can manage budget in their school" 
  ON public.budget 
  FOR ALL 
  USING (
    public.get_current_user_role() = 'admin' AND 
    school_id = public.get_current_user_school_id()
  );

-- Expenses policies
CREATE POLICY "Users can view expenses from their school" 
  ON public.expenses 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can manage expenses in their school" 
  ON public.expenses 
  FOR ALL 
  USING (school_id = public.get_current_user_school_id());

-- Inventory policies
CREATE POLICY "Users can view inventory from their school" 
  ON public.inventory_items 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Users can manage inventory in their school" 
  ON public.inventory_items 
  FOR ALL 
  USING (school_id = public.get_current_user_school_id());
