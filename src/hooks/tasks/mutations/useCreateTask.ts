
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreateTaskData } from '../types';

export const useCreateTask = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      console.log('Creating task with data:', taskData);

      // Validate that we have required data
      if (!taskData.status || !taskData.priority) {
        throw new Error('Status and priority are required');
      }

      // Build the insert data object with proper string values
      const insertData = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status, // Now stored as text
        priority: taskData.priority, // Now stored as text
        assigned_to: taskData.assigned_to,
        due_date: taskData.due_date,
        school_id: userProfile?.school_id,
        assigned_by: userProfile?.id,
        team_id: taskData.team_id,
      };

      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log('Task created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
      
      // Email notifications are handled automatically by database triggers
    },
    onError: (error: any) => {
      console.error('Create task mutation error:', error);
      
      let errorMessage = "Failed to create task. Please try again.";
      
      // Provide more specific error messages based on the error
      if (error?.code === '23514') {
        errorMessage = "Invalid status or priority value. Please check that the selected options are valid.";
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
