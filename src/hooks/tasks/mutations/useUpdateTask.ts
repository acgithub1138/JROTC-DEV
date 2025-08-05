
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/email/useEmailService';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions } from '@/hooks/useTaskOptions';
import { isCompletionStatus, getDefaultCancelStatus } from '@/utils/taskStatusUtils';
import { shouldTriggerStatusChangeEmail } from '@/utils/emailRuleHelper';
import { Task } from '../types';

export const useUpdateTask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { statusOptions } = useTaskStatusOptions();
  const { processEmailRules } = useEmailService();
  const { userProfile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...taskData }: Partial<Task> & { id: string }) => {
      console.log('Updating task:', { id, taskData });

      // Store original status for email rule detection
      const { data: originalTask } = await supabase
        .from('tasks')
        .select('status, assigned_to')
        .eq('id', id)
        .single();

      const updateData: any = {};
      
      // Only include fields that exist in the database table
      if (taskData.title !== undefined) updateData.title = taskData.title;
      if (taskData.description !== undefined) updateData.description = taskData.description;
      if (taskData.status !== undefined) updateData.status = taskData.status;
      if (taskData.priority !== undefined) updateData.priority = taskData.priority;
      if (taskData.assigned_to !== undefined) updateData.assigned_to = taskData.assigned_to;
      if (taskData.due_date !== undefined) updateData.due_date = taskData.due_date;
      if (taskData.team_id !== undefined) updateData.team_id = taskData.team_id;
      if (taskData.completed_at !== undefined) updateData.completed_at = taskData.completed_at;

      // Auto-set completed_at ONLY when status changes to completion (not cancellation)
      if (taskData.status && isCompletionStatus(taskData.status, statusOptions)) {
        if (!taskData.completed_at) {
          updateData.completed_at = new Date().toISOString();
        }
      }

      // Auto-change status to "pending_response" if status is being set to "need_information"
      if (taskData.status === 'need_information') {
        updateData.status = 'pending_response';
      }

      console.log('Final update data:', updateData);

      // Update the main task
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      // If task is being canceled, cancel all its subtasks as well
      const cancelStatus = getDefaultCancelStatus(statusOptions);
      if (taskData.status === cancelStatus) {
        console.log('Task canceled, canceling all subtasks...');
        
        const { error: subtaskError } = await supabase
          .from('subtasks')
          .update({ 
            status: cancelStatus
            // Don't set completed_at for canceled subtasks
          })
          .eq('parent_task_id', id)
          .neq('status', cancelStatus); // Only update subtasks that aren't already canceled

        if (subtaskError) {
          console.error('Error canceling subtasks:', subtaskError);
          // Don't throw here - the main task update was successful
        } else {
          console.log('All subtasks canceled successfully');
        }
      }
      
      console.log('Task updated successfully');
      
      // Trigger email notifications for status changes
      const emailRuleType = shouldTriggerStatusChangeEmail(originalTask?.status, taskData.status);
      if (emailRuleType && originalTask?.assigned_to && userProfile?.school_id) {
        try {
          processEmailRules({
            sourceTable: 'tasks',
            recordId: id,
            schoolId: userProfile.school_id,
            operationType: `task_${emailRuleType}`,
          });
        } catch (error) {
          console.error(`Failed to trigger email for task_${emailRuleType}:`, error);
        }
      }
      
      return { originalStatus: originalTask?.status, newStatus: taskData.status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-subtasks'] });
      toast({
        title: "Task updated",
        description: "The task has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Update task mutation error:', error);
      
      let errorMessage = "Failed to update task. Please try again.";
      
      if (error?.code === '42883') {
        errorMessage = "Database schema error. Please check that the task status and priority values are valid.";
      } else if (error?.code === 'PGRST116') {
        errorMessage = "You don't have permission to update this task.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};
