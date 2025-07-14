
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Task } from '../types';

export const useUpdateTask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...taskData }: Partial<Task> & { id: string }) => {
      console.log('Updating task:', { id, taskData });

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

      // Auto-set completed_at when status changes to "done" or "canceled"
      if (taskData.status === 'done' || taskData.status === 'canceled') {
        if (!taskData.completed_at) {
          updateData.completed_at = new Date().toISOString();
        }
      }

      console.log('Final update data:', updateData);

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      console.log('Task updated successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
