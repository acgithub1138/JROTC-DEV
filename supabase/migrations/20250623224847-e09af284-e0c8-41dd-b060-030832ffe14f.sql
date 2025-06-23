
-- Create tables for configurable task status and priority options
CREATE TABLE public.task_status_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  color_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  school_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, value)
);

CREATE TABLE public.task_priority_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  color_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  school_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, value)
);

-- Enable RLS
ALTER TABLE public.task_status_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_priority_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_status_options
CREATE POLICY "Users can view status options for their school" ON public.task_status_options
  FOR SELECT USING (school_id = public.get_user_school_id());

CREATE POLICY "Instructors and command_staff can manage status options" ON public.task_status_options
  FOR ALL USING (
    school_id = public.get_user_school_id() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'command_staff')
    )
  );

-- RLS policies for task_priority_options
CREATE POLICY "Users can view priority options for their school" ON public.task_priority_options
  FOR SELECT USING (school_id = public.get_user_school_id());

CREATE POLICY "Instructors and command_staff can manage priority options" ON public.task_priority_options
  FOR ALL USING (
    school_id = public.get_user_school_id() AND
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('instructor', 'command_staff')
    )
  );

-- Insert default status options
INSERT INTO public.task_status_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'not_started', 'Not Started', 'bg-gray-100 text-gray-800', 1, s.id
FROM public.schools s;

INSERT INTO public.task_status_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'working_on_it', 'Working On It', 'bg-blue-100 text-blue-800', 2, s.id
FROM public.schools s;

INSERT INTO public.task_status_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'stuck', 'Stuck', 'bg-red-100 text-red-800', 3, s.id
FROM public.schools s;

INSERT INTO public.task_status_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'done', 'Done', 'bg-green-100 text-green-800', 4, s.id
FROM public.schools s;

-- Insert default priority options
INSERT INTO public.task_priority_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'low', 'Low', 'bg-green-100 text-green-800', 1, s.id
FROM public.schools s;

INSERT INTO public.task_priority_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'medium', 'Medium', 'bg-yellow-100 text-yellow-800', 2, s.id
FROM public.schools s;

INSERT INTO public.task_priority_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'high', 'High', 'bg-orange-100 text-orange-800', 3, s.id
FROM public.schools s;

INSERT INTO public.task_priority_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'urgent', 'Urgent', 'bg-red-100 text-red-800', 4, s.id
FROM public.schools s;

INSERT INTO public.task_priority_options (value, label, color_class, sort_order, school_id) 
SELECT 
  'critical', 'Critical', 'bg-purple-100 text-purple-800', 5, s.id
FROM public.schools s;

-- Add updated_at triggers
CREATE TRIGGER update_task_status_options_updated_at 
  BEFORE UPDATE ON public.task_status_options 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_task_priority_options_updated_at 
  BEFORE UPDATE ON public.task_priority_options 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
