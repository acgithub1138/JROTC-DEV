import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/email/useEmailService';
import { useAuth } from '@/contexts/AuthContext';
import { shouldTriggerStatusChangeEmail } from '@/utils/emailRuleHelper';

export const useUpdateSubtask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processEmailRules } = useEmailService();
  const { userProfile } = useAuth();

  return useMutation({
    mutationFn: async (updateData: { id: string; [key: string]: any }) => {
      const { id, ...updates } = updateData;
      
      // Store original status for email rule detection
      const { data: originalSubtask } = await supabase
        .from('subtasks')
        .select('status, assigned_to')
        .eq('id', id)
        .single();
      
      // Auto-set completed_at when status changes to "completed" or "canceled"
      if (updates.status === 'completed' || updates.status === 'canceled') {
        if (!updates.completed_at) {
          updates.completed_at = new Date().toISOString();
        }
      }

      // Auto-change status to "pending_response" if status is being set to "need_information"
      if (updates.status === 'need_information') {
        updates.status = 'pending_response';
      }
      
      const { error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Trigger email notifications for status changes
      const emailRuleType = shouldTriggerStatusChangeEmail(originalSubtask?.status, updates.status);
      if (emailRuleType && originalSubtask?.assigned_to && userProfile?.school_id) {
        try {
          processEmailRules({
            sourceTable: 'subtasks',
            recordId: id,
            schoolId: userProfile.school_id,
            operationType: `subtask_${emailRuleType}`,
          });
        } catch (error) {
          console.error(`Failed to trigger email for subtask_${emailRuleType}:`, error);
        }
      }
      
      return { originalStatus: originalSubtask?.status, newStatus: updates.status };
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