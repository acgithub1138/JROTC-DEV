
-- Create business_rules table to store the rules
CREATE TABLE public.business_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_table TEXT,
  trigger_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  school_id UUID NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_executed TIMESTAMP WITH TIME ZONE
);

-- Create schema_tracking table to hold table and field information
CREATE TABLE public.schema_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  data_type TEXT NOT NULL,
  is_nullable BOOLEAN NOT NULL DEFAULT true,
  column_default TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_name, column_name)
);

-- Add RLS policies for business_rules
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business rules from their school" 
  ON public.business_rules 
  FOR SELECT 
  USING (school_id = get_current_user_school_id());

CREATE POLICY "Users can create business rules for their school" 
  ON public.business_rules 
  FOR INSERT 
  WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Users can update business rules from their school" 
  ON public.business_rules 
  FOR UPDATE 
  USING (school_id = get_current_user_school_id());

CREATE POLICY "Users can delete business rules from their school" 
  ON public.business_rules 
  FOR DELETE 
  USING (school_id = get_current_user_school_id());

-- Add RLS policies for schema_tracking (read-only for all authenticated users)
ALTER TABLE public.schema_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schema tracking" 
  ON public.schema_tracking 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Add trigger for updated_at on business_rules
CREATE TRIGGER business_rules_updated_at
  BEFORE UPDATE ON public.business_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger for updated_at on schema_tracking
CREATE TRIGGER schema_tracking_updated_at
  BEFORE UPDATE ON public.schema_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial schema tracking data for existing tables
INSERT INTO public.schema_tracking (table_name, column_name, data_type, is_nullable, is_active) VALUES
-- tasks table
('tasks', 'id', 'uuid', false, true),
('tasks', 'title', 'text', false, true),
('tasks', 'description', 'text', true, true),
('tasks', 'status', 'task_status', false, true),
('tasks', 'priority', 'task_priority', false, true),
('tasks', 'due_date', 'timestamp with time zone', true, true),
('tasks', 'assigned_to', 'uuid', true, true),
('tasks', 'assigned_by', 'uuid', true, true),
('tasks', 'school_id', 'uuid', false, true),
('tasks', 'team_id', 'uuid', true, true),
('tasks', 'task_number', 'text', true, true),
('tasks', 'created_at', 'timestamp with time zone', false, true),
('tasks', 'updated_at', 'timestamp with time zone', false, true),
('tasks', 'completed_at', 'timestamp with time zone', true, true),

-- profiles table
('profiles', 'id', 'uuid', false, true),
('profiles', 'first_name', 'text', false, true),
('profiles', 'last_name', 'text', false, true),
('profiles', 'email', 'text', false, true),
('profiles', 'phone', 'text', true, true),
('profiles', 'role', 'user_role', false, true),
('profiles', 'rank', 'user_rank', true, true),
('profiles', 'school_id', 'uuid', false, true),
('profiles', 'created_at', 'timestamp with time zone', false, true),
('profiles', 'updated_at', 'timestamp with time zone', false, true),

-- cadets table
('cadets', 'id', 'uuid', false, true),
('cadets', 'cadet_id', 'text', false, true),
('cadets', 'profile_id', 'uuid', false, true),
('cadets', 'school_id', 'uuid', false, true),
('cadets', 'grade_level', 'integer', true, true),
('cadets', 'date_of_birth', 'date', true, true),
('cadets', 'enlistment_date', 'date', true, true),
('cadets', 'graduation_date', 'date', true, true),
('cadets', 'gpa', 'numeric', true, true),
('cadets', 'attendance_percentage', 'numeric', true, true),
('cadets', 'parent_name', 'text', true, true),
('cadets', 'parent_email', 'text', true, true),
('cadets', 'parent_phone', 'text', true, true),
('cadets', 'emergency_contact_name', 'text', true, true),
('cadets', 'emergency_contact_phone', 'text', true, true),
('cadets', 'uniform_size', 'text', true, true),
('cadets', 'medical_conditions', 'text', true, true),
('cadets', 'created_at', 'timestamp with time zone', false, true),
('cadets', 'updated_at', 'timestamp with time zone', false, true),

-- teams table
('teams', 'id', 'uuid', false, true),
('teams', 'name', 'text', false, true),
('teams', 'description', 'text', true, true),
('teams', 'school_id', 'uuid', false, true),
('teams', 'team_lead_id', 'uuid', true, true),
('teams', 'created_at', 'timestamp with time zone', false, true),
('teams', 'updated_at', 'timestamp with time zone', false, true),

-- competitions table
('competitions', 'id', 'uuid', false, true),
('competitions', 'name', 'text', false, true),
('competitions', 'description', 'text', true, true),
('competitions', 'type', 'competition_type', false, true),
('competitions', 'competition_date', 'date', false, true),
('competitions', 'location', 'text', true, true),
('competitions', 'registration_deadline', 'date', true, true),
('competitions', 'created_at', 'timestamp with time zone', false, true),
('competitions', 'updated_at', 'timestamp with time zone', false, true),

-- budget table
('budget', 'id', 'uuid', false, true),
('budget', 'name', 'text', false, true),
('budget', 'description', 'text', true, true),
('budget', 'category', 'budget_category', false, true),
('budget', 'fiscal_year', 'integer', false, true),
('budget', 'allocated_amount', 'numeric', false, true),
('budget', 'spent_amount', 'numeric', false, true),
('budget', 'school_id', 'uuid', false, true),
('budget', 'created_by', 'uuid', true, true),
('budget', 'created_at', 'timestamp with time zone', false, true),
('budget', 'updated_at', 'timestamp with time zone', false, true),

-- expenses table
('expenses', 'id', 'uuid', false, true),
('expenses', 'description', 'text', false, true),
('expenses', 'amount', 'numeric', false, true),
('expenses', 'expense_date', 'date', false, true),
('expenses', 'vendor', 'text', true, true),
('expenses', 'budget_id', 'uuid', false, true),
('expenses', 'school_id', 'uuid', false, true),
('expenses', 'created_by', 'uuid', true, true),
('expenses', 'approved_by', 'uuid', true, true),
('expenses', 'approved_at', 'timestamp with time zone', true, true),
('expenses', 'receipt_url', 'text', true, true),
('expenses', 'created_at', 'timestamp with time zone', false, true),

-- inventory_items table
('inventory_items', 'id', 'uuid', false, true),
('inventory_items', 'name', 'text', false, true),
('inventory_items', 'description', 'text', true, true),
('inventory_items', 'category', 'text', true, true),
('inventory_items', 'serial_number', 'text', true, true),
('inventory_items', 'status', 'inventory_status', false, true),
('inventory_items', 'condition', 'text', true, true),
('inventory_items', 'location', 'text', true, true),
('inventory_items', 'purchase_date', 'date', true, true),
('inventory_items', 'purchase_price', 'numeric', true, true),
('inventory_items', 'school_id', 'uuid', false, true),
('inventory_items', 'notes', 'text', true, true),
('inventory_items', 'created_at', 'timestamp with time zone', false, true),
('inventory_items', 'updated_at', 'timestamp with time zone', false, true);
