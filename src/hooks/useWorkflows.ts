
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow';

export const useWorkflows = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Workflow interface
      return (data || []).map(item => ({
        ...item,
        workflow_data: typeof item.workflow_data === 'object' && item.workflow_data !== null && !Array.isArray(item.workflow_data)
          ? (item.workflow_data as { nodes?: WorkflowNode[]; edges?: WorkflowEdge[] })
          : { nodes: [], edges: [] }
      })).map(item => ({
        ...item,
        workflow_data: {
          nodes: item.workflow_data.nodes || [],
          edges: item.workflow_data.edges || []
        }
      })) as Workflow[];
    },
    enabled: !!userProfile?.school_id,
  });

  const createWorkflow = useMutation({
    mutationFn: async (workflowData: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name: workflowData.name,
          description: workflowData.description,
          school_id: userProfile?.school_id,
          created_by: userProfile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: "Workflow created",
        description: "The workflow has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create workflow. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating workflow:', error);
    },
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ 
      id, 
      nodes, 
      edges, 
      ...workflowData 
    }: { 
      id: string; 
      nodes?: WorkflowNode[]; 
      edges?: WorkflowEdge[];
      name?: string;
      description?: string;
      is_active?: boolean;
    }) => {
      const updateData: any = { ...workflowData };
      
      if (nodes && edges) {
        updateData.workflow_data = { nodes, edges };
      }

      const { data, error } = await supabase
        .from('workflows')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: "Workflow updated",
        description: "The workflow has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update workflow. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating workflow:', error);
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: "Workflow deleted",
        description: "The workflow has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete workflow. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting workflow:', error);
    },
  });

  return {
    workflows,
    isLoading,
    createWorkflow: createWorkflow.mutate,
    updateWorkflow: updateWorkflow.mutate,
    deleteWorkflow: deleteWorkflow.mutate,
    isCreating: createWorkflow.isPending,
    isUpdating: updateWorkflow.isPending,
    isDeleting: deleteWorkflow.isPending,
  };
};
