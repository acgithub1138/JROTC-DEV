
-- Create workflow tables
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  school_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  workflow_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb
);

-- Create workflow nodes table
CREATE TABLE public.workflow_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- React Flow node ID
  node_type TEXT NOT NULL, -- 'trigger', 'condition', 'action', 'data'
  node_subtype TEXT NOT NULL, -- 'database_change', 'schedule', 'field_comparison', etc.
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, node_id)
);

-- Create workflow connections table
CREATE TABLE public.workflow_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (workflow_id, source_node_id) REFERENCES public.workflow_nodes(workflow_id, node_id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_id, target_node_id) REFERENCES public.workflow_nodes(workflow_id, node_id) ON DELETE CASCADE
);

-- Create workflow executions table
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  trigger_data JSONB,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'::jsonb
);

-- Create workflow variables table
CREATE TABLE public.workflow_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  variable_value JSONB,
  variable_type TEXT NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'object', 'array'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, variable_name)
);

-- Add RLS policies
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_variables ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view workflows from their school" ON public.workflows
  FOR SELECT USING (school_id = get_current_user_school_id());

CREATE POLICY "Users can create workflows for their school" ON public.workflows
  FOR INSERT WITH CHECK (school_id = get_current_user_school_id() AND created_by = auth.uid());

CREATE POLICY "Users can update workflows they created" ON public.workflows
  FOR UPDATE USING (created_by = auth.uid() AND school_id = get_current_user_school_id());

CREATE POLICY "Users can delete workflows they created" ON public.workflows
  FOR DELETE USING (created_by = auth.uid() AND school_id = get_current_user_school_id());

-- Workflow nodes policies
CREATE POLICY "Users can view workflow nodes from their school" ON public.workflow_nodes
  FOR SELECT USING (workflow_id IN (SELECT id FROM public.workflows WHERE school_id = get_current_user_school_id()));

CREATE POLICY "Users can manage workflow nodes they own" ON public.workflow_nodes
  FOR ALL USING (workflow_id IN (SELECT id FROM public.workflows WHERE created_by = auth.uid()));

-- Workflow connections policies
CREATE POLICY "Users can view workflow connections from their school" ON public.workflow_connections
  FOR SELECT USING (workflow_id IN (SELECT id FROM public.workflows WHERE school_id = get_current_user_school_id()));

CREATE POLICY "Users can manage workflow connections they own" ON public.workflow_connections
  FOR ALL USING (workflow_id IN (SELECT id FROM public.workflows WHERE created_by = auth.uid()));

-- Workflow executions policies
CREATE POLICY "Users can view workflow executions from their school" ON public.workflow_executions
  FOR SELECT USING (workflow_id IN (SELECT id FROM public.workflows WHERE school_id = get_current_user_school_id()));

CREATE POLICY "Users can create workflow executions for their school" ON public.workflow_executions
  FOR INSERT WITH CHECK (workflow_id IN (SELECT id FROM public.workflows WHERE school_id = get_current_user_school_id()));

-- Workflow variables policies
CREATE POLICY "Users can view workflow variables from their school" ON public.workflow_variables
  FOR SELECT USING (workflow_id IN (SELECT id FROM public.workflows WHERE school_id = get_current_user_school_id()));

CREATE POLICY "Users can manage workflow variables they own" ON public.workflow_variables
  FOR ALL USING (workflow_id IN (SELECT id FROM public.workflows WHERE created_by = auth.uid()));

-- Add updated_at trigger for workflows
CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger for workflow_nodes
CREATE TRIGGER workflow_nodes_updated_at
  BEFORE UPDATE ON public.workflow_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add updated_at trigger for workflow_variables
CREATE TRIGGER workflow_variables_updated_at
  BEFORE UPDATE ON public.workflow_variables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
