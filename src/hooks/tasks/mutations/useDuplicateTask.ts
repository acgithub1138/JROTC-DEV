import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Task } from '../types';

export const useDuplicateTask = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      console.log('Duplicating task with ID:', taskId);

      // Fetch the original task
      const { data: originalTask, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) {
        console.error('Error fetching task:', taskError);
        throw taskError;
      }

      // Fetch the original subtasks
      const { data: originalSubtasks, error: subtasksError } = await supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', taskId);

      if (subtasksError) {
        console.error('Error fetching subtasks:', subtasksError);
        throw subtasksError;
      }

      // Create the duplicate task with reset properties
      const duplicateTaskData = {
        title: originalTask.title,
        description: originalTask.description,
        priority: originalTask.priority,
        status: 'not_started',
        assigned_to: null,
        assigned_by: userProfile?.id,
        due_date: null,
        school_id: userProfile?.school_id,
        team_id: originalTask.team_id,
      };

      const { data: newTask, error: createTaskError } = await supabase
        .from('tasks')
        .insert(duplicateTaskData)
        .select()
        .single();

      if (createTaskError) {
        console.error('Error creating duplicate task:', createTaskError);
        throw createTaskError;
      }

      // Create duplicate subtasks if they exist
      if (originalSubtasks && originalSubtasks.length > 0) {
        const duplicateSubtasksData = originalSubtasks.map(subtask => ({
          parent_task_id: newTask.id,
          title: subtask.title,
          description: subtask.description,
          priority: subtask.priority,
          status: 'not_started',
          assigned_to: null,
          assigned_by: userProfile?.id,
          due_date: null,
          school_id: userProfile?.school_id,
          team_id: subtask.team_id,
        }));

        const { error: createSubtasksError } = await supabase
          .from('subtasks')
          .insert(duplicateSubtasksData);

        if (createSubtasksError) {
          console.error('Error creating duplicate subtasks:', createSubtasksError);
          throw createSubtasksError;
        }
      }

      console.log('Task duplicated successfully:', newTask);
      return { newTask, subtaskCount: originalSubtasks?.length || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      
      const subtaskMessage = data.subtaskCount > 0 
        ? ` and ${data.subtaskCount} subtask${data.subtaskCount === 1 ? '' : 's'}`
        : '';
      
      toast({
        title: "Task duplicated",
        description: `The task${subtaskMessage} have been duplicated successfully.`,
      });
    },
    onError: (error: any) => {
      console.error('Duplicate task mutation error:', error);
      
      let errorMessage = "Failed to duplicate task. Please try again.";
      
      if (error?.code === 'PGRST116') {
        errorMessage = "You don't have permission to create tasks.";
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