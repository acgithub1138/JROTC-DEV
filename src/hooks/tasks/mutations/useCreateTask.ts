
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreateTaskData } from '../types';
import { validateTaskStatus, validateTaskPriority } from '../utils/taskValidation';

export const useCreateTask = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      console.log('Creating task with data:', taskData);

      // Validate enum values before sending to database
      const validatedStatus = validateTaskStatus(taskData.status);
      const validatedPriority = validateTaskPriority(taskData.priority);

      console.log('Validated insert data:', {
        title: taskData.title,
        description: taskData.description,
        status: validatedStatus,
        priority: validatedPriority,
        assigned_to: taskData.assigned_to,
        due_date: taskData.due_date,
        school_id: userProfile?.school_id,
        assigned_by: userProfile?.id,
        team_id: taskData.team_id,
      });

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          status: validatedStatus,
          priority: validatedPriority,
          assigned_to: taskData.assigned_to,
          due_date: taskData.due_date,
          school_id: userProfile?.school_id,
          assigned_by: userProfile?.id,
          team_id: taskData.team_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log('Task created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Create task mutation error:', error);
      
      let errorMessage = "Failed to create task. Please try again.";
      
      // Provide more specific error messages based on the error
      if (error?.code === '42883') {
        errorMessage = "Database schema error. Please check that the task status and priority values are valid.";
      } else if (error?.code === 'PGRST116') {
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
