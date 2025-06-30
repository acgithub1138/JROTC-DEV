
-- Create enum types for email system
CREATE TYPE email_trigger_event AS ENUM ('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE email_queue_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
CREATE TYPE email_log_event AS ENUM ('queued', 'sent', 'failed', 'opened', 'clicked');

-- Email Templates Table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- Rich HTML content
  source_table TEXT NOT NULL,
  variables_used JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Rules Table
CREATE TABLE public.email_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  trigger_event email_trigger_event NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb, -- Conditions for UPDATE events
  recipient_config JSONB NOT NULL, -- How to determine recipients
  is_active BOOLEAN NOT NULL DEFAULT true,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Queue Table
CREATE TABLE public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.email_templates(id),
  rule_id UUID REFERENCES public.email_rules(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status email_queue_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  record_id UUID, -- ID of the record that triggered this email
  source_table TEXT,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Logs Table
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.email_queue(id) ON DELETE CASCADE,
  event_type email_log_event NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Users can view email templates in their school" 
  ON public.email_templates 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage email templates in their school" 
  ON public.email_templates 
  FOR ALL 
  USING (
    school_id = public.get_current_user_school_id() 
    AND public.get_current_user_role() IN ('instructor', 'command_staff', 'admin')
  );

-- RLS Policies for email_rules
CREATE POLICY "Users can view email rules in their school" 
  ON public.email_rules 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage email rules in their school" 
  ON public.email_rules 
  FOR ALL 
  USING (
    school_id = public.get_current_user_school_id() 
    AND public.get_current_user_role() IN ('instructor', 'command_staff', 'admin')
  );

-- RLS Policies for email_queue
CREATE POLICY "Users can view email queue in their school" 
  ON public.email_queue 
  FOR SELECT 
  USING (school_id = public.get_current_user_school_id());

CREATE POLICY "Instructors can manage email queue in their school" 
  ON public.email_queue 
  FOR ALL 
  USING (
    school_id = public.get_current_user_school_id() 
    AND public.get_current_user_role() IN ('instructor', 'command_staff', 'admin')
  );

-- RLS Policies for email_logs
CREATE POLICY "Users can view email logs in their school" 
  ON public.email_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.email_queue eq 
      WHERE eq.id = email_logs.queue_id 
      AND eq.school_id = public.get_current_user_school_id()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at_email_templates
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_email_rules
  BEFORE UPDATE ON public.email_rules
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_email_queue
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to get available table columns for variable substitution
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
$$;

-- Function to process email template variables
CREATE OR REPLACE FUNCTION public.process_email_template(
  template_content text,
  record_data jsonb
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  result text := template_content;
  key text;
  value text;
BEGIN
  -- Replace variables in format {{variable_name}}
  FOR key, value IN SELECT * FROM jsonb_each_text(record_data)
  LOOP
    result := replace(result, '{{' || key || '}}', COALESCE(value, ''));
  END LOOP;
  
  RETURN result;
END;
$$;
