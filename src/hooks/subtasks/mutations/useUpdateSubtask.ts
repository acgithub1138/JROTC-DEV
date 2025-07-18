import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUpdateSubtask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateData: { id: string; [key: string]: any }) => {
      const { id, ...updates } = updateData;
      
      // Auto-set completed_at when status changes to "completed" or "canceled"
      if (updates.status === 'completed' || updates.status === 'canceled') {
        if (!updates.completed_at) {
          updates.completed_at = new Date().toISOString();
        }
      }
      
      const { error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate all subtask queries (both general and specific parent task queries)
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Force refetch to ensure UI updates immediately
      queryClient.refetchQueries({ queryKey: ['subtasks'] });
      
      toast({
        title: "Subtask updated",
        description: "The subtask has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update subtask. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating subtask:', error);
    },
  });
};