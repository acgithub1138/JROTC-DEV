
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WorkflowExecution, WorkflowNode, WorkflowEdge } from '@/types/workflow';

export const useWorkflowExecution = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['workflow-executions', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select(`
          *,
          workflows!inner(
            name,
            school_id
          )
        `)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.school_id,
  });

  const executeWorkflow = useMutation({
    mutationFn: async ({ 
      workflowId, 
      triggerType, 
      triggerData 
    }: { 
      workflowId: string; 
      triggerType: string; 
      triggerData?: any 
    }) => {
      // Create execution record
      const { data: execution, error: executionError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          trigger_type: triggerType,
          trigger_data: triggerData,
          status: 'running',
          execution_log: []
        })
        .select()
        .single();

      if (executionError) throw executionError;

      // Get workflow data
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;

      // Parse workflow_data safely
      const workflowData = typeof workflow.workflow_data === 'object' && workflow.workflow_data !== null && !Array.isArray(workflow.workflow_data)
        ? (workflow.workflow_data as { nodes?: WorkflowNode[]; edges?: WorkflowEdge[] })
        : { nodes: [], edges: [] };

      // Execute workflow
      const result = await executeWorkflowNodes(
        execution.id,
        workflowData.nodes || [],
        workflowData.edges || []
      );

      return { execution, result };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast({
        title: "Workflow executed",
        description: "The workflow has been executed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Execution failed",
        description: "Failed to execute workflow. Please try again.",
        variant: "destructive",
      });
      console.error('Error executing workflow:', error);
    },
  });

  const cancelExecution = useMutation({
    mutationFn: async (executionId: string) => {
      const { error } = await supabase
        .from('workflow_executions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          error_message: 'Cancelled by user'
        })
        .eq('id', executionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast({
        title: "Execution cancelled",
        description: "The workflow execution has been cancelled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel execution. Please try again.",
        variant: "destructive",
      });
      console.error('Error cancelling execution:', error);
    },
  });

  return {
    executions,
    isLoading,
    executeWorkflow: executeWorkflow.mutate,
    cancelExecution: cancelExecution.mutate,
    isExecuting: executeWorkflow.isPending,
    isCancelling: cancelExecution.isPending,
  };
};

async function executeWorkflowNodes(
  executionId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Promise<any> {
  const executionLog: any[] = [];
  
  try {
    // Find trigger nodes (starting points)
    const triggerNodes = nodes.filter(node => node.data.nodeType === 'trigger');
    
    if (triggerNodes.length === 0) {
      throw new Error('No trigger nodes found in workflow');
    }

    // Execute each trigger node
    for (const triggerNode of triggerNodes) {
      await executeNodeChain(executionId, triggerNode, nodes, edges, executionLog);
    }

    // Update execution status
    await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        execution_log: executionLog
      })
      .eq('id', executionId);

    return { success: true, log: executionLog };
  } catch (error) {
    // Update execution status with error
    await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        execution_log: executionLog
      })
      .eq('id', executionId);

    throw error;
  }
}

async function executeNodeChain(
  executionId: string,
  currentNode: WorkflowNode,
  allNodes: WorkflowNode[],
  edges: WorkflowEdge[],
  executionLog: any[]
): Promise<void> {
  // Log node execution start
  executionLog.push({
    timestamp: new Date().toISOString(),
    nodeId: currentNode.id,
    nodeType: currentNode.data.nodeType,
    nodeSubtype: currentNode.data.nodeSubtype,
    status: 'started',
    message: `Executing ${currentNode.data.label}`
  });

  try {
    // Execute the current node
    const result = await executeNode(currentNode);
    
    // Log successful execution
    executionLog.push({
      timestamp: new Date().toISOString(),
      nodeId: currentNode.id,
      status: 'completed',
      result: result
    });

    // Find connected nodes
    const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
    
    for (const edge of outgoingEdges) {
      const nextNode = allNodes.find(node => node.id === edge.target);
      if (nextNode) {
        // For condition nodes, check the handle to determine path
        if (currentNode.data.nodeType === 'condition') {
          const shouldExecute = evaluateCondition(currentNode, result, edge.sourceHandle);
          if (shouldExecute) {
            await executeNodeChain(executionId, nextNode, allNodes, edges, executionLog);
          }
        } else {
          // For other nodes, always execute next node
          await executeNodeChain(executionId, nextNode, allNodes, edges, executionLog);
        }
      }
    }
  } catch (error) {
    // Log node execution error
    executionLog.push({
      timestamp: new Date().toISOString(),
      nodeId: currentNode.id,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

async function executeNode(node: WorkflowNode): Promise<any> {
  console.log(`Executing node: ${node.data.label} (${node.data.nodeSubtype})`);
  
  switch (node.data.nodeType) {
    case 'trigger':
      return executeTriggerNode(node);
    case 'condition':
      return executeConditionNode(node);
    case 'action':
      return executeActionNode(node);
    case 'data':
      return executeDataNode(node);
    default:
      throw new Error(`Unknown node type: ${node.data.nodeType}`);
  }
}

async function executeTriggerNode(node: WorkflowNode): Promise<any> {
  // Trigger nodes are entry points, they don't perform actions
  return { triggered: true, timestamp: new Date().toISOString() };
}

async function executeConditionNode(node: WorkflowNode): Promise<any> {
  const config = node.data.configuration;
  
  switch (node.data.nodeSubtype) {
    case 'field_comparison':
      // Simulate field comparison
      return { condition: 'field_comparison', result: true };
    case 'datetime_condition':
      // Simulate datetime check
      return { condition: 'datetime_condition', result: true };
    case 'role_check':
      // Simulate role check
      return { condition: 'role_check', result: true };
    default:
      return { condition: 'default', result: true };
  }
}

async function executeActionNode(node: WorkflowNode): Promise<any> {
  const config = node.data.configuration;
  
  switch (node.data.nodeSubtype) {
    case 'create_record':
      // Simulate record creation
      console.log('Creating record:', config);
      return { action: 'create_record', recordId: 'simulated-id' };
    case 'update_record':
      // Simulate record update
      console.log('Updating record:', config);
      return { action: 'update_record', updated: true };
    case 'delete_record':
      // Simulate record deletion
      console.log('Deleting record:', config);
      return { action: 'delete_record', deleted: true };
    case 'send_email':
      // Simulate email sending
      console.log('Sending email:', config);
      return { action: 'send_email', sent: true };
    case 'external_api':
      // Simulate API call
      console.log('Calling external API:', config);
      return { action: 'external_api', response: 'simulated-response' };
    default:
      return { action: node.data.nodeSubtype, executed: true };
  }
}

async function executeDataNode(node: WorkflowNode): Promise<any> {
  const config = node.data.configuration;
  
  switch (node.data.nodeSubtype) {
    case 'field_mapping':
      // Simulate field mapping
      return { data: 'field_mapping', mapped: true };
    case 'calculation':
      // Simulate calculation
      return { data: 'calculation', result: 42 };
    case 'data_lookup':
      // Simulate data lookup
      return { data: 'data_lookup', found: true };
    default:
      return { data: node.data.nodeSubtype, processed: true };
  }
}

function evaluateCondition(node: WorkflowNode, result: any, sourceHandle?: string): boolean {
  // For condition nodes, determine which path to take based on the source handle
  if (sourceHandle === 'true') {
    return result.result === true;
  } else if (sourceHandle === 'false') {
    return result.result === false;
  }
  
  // Default to true if no specific handle
  return true;
}
