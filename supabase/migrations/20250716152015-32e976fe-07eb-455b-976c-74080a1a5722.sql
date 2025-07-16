-- Create email_rules table for managing automated email rules
CREATE TABLE public.email_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('task_created', 'task_information_needed', 'task_completed', 'task_canceled')),
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('INSERT', 'UPDATE')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one rule per type per school
  UNIQUE(school_id, rule_type)
);

-- Add indexes for performance
CREATE INDEX idx_email_rules_school_id ON public.email_rules(school_id);
CREATE INDEX idx_email_rules_active ON public.email_rules(school_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.email_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view email rules in their school" ON public.email_rules
  FOR SELECT USING (school_id = get_current_user_school_id());

CREATE POLICY "Instructors can manage email rules in their school" ON public.email_rules
  FOR ALL USING (
    school_id = get_current_user_school_id() AND 
    get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
  );

-- Add updated_at trigger
CREATE TRIGGER email_rules_updated_at
  BEFORE UPDATE ON public.email_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed default rules for all existing schools
INSERT INTO public.email_rules (school_id, rule_type, trigger_event, is_active)
SELECT 
  s.id as school_id,
  rule_type,
  CASE 
    WHEN rule_type = 'task_created' THEN 'INSERT'
    ELSE 'UPDATE'
  END as trigger_event,
  false as is_active
FROM public.schools s
CROSS JOIN (
  SELECT 'task_created' as rule_type
  UNION SELECT 'task_information_needed'
  UNION SELECT 'task_completed' 
  UNION SELECT 'task_canceled'
) rules
ON CONFLICT (school_id, rule_type) DO NOTHING;