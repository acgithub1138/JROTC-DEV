
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: 'trigger' | 'condition' | 'action' | 'data';
    nodeSubtype: string;
    configuration: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  school_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  version: number;
  workflow_data: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_type: string;
  trigger_data?: any;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  execution_log: any[];
}

export interface NodeTypeDefinition {
  type: string;
  subtype: string;
  label: string;
  description: string;
  category: 'trigger' | 'condition' | 'action' | 'data';
  icon: string;
  configSchema: any;
}
