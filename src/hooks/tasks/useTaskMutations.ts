
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Task, CreateTaskData } from './types';
import { TaskStatus, TaskPriority, getTaskStatusValues, getTaskPriorityValues } from '@/config/taskOptions';

// Helper function to validate enum values with proper typing
const validateTaskStatus = (value: string): TaskStatus => {
  const validValues = getTaskStatusValues();
  if (!validValues.includes(value as TaskStatus)) {
    console.error(`Invalid status value: ${value}. Valid values:`, validValues);
    throw new Error(`Invalid status value: ${value}`);
  }
  return value as TaskStatus;
};

const validateTaskPriority = (value: string): TaskPriority => {
  const validValues = getTaskPriorityValues();
  if (!validValues.includes(value as TaskPriority)) {
    console.error(`Invalid priority value: ${value}. Valid values:`, validValues);
    throw new Error(`Invalid priority value: ${value}`);
  }
  return value as TaskPriority;
};

export const useTaskMutations = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      console.log('Creating task with data:', taskData);

      // Validate enum values before sending to database
      const validatedStatus = validateTaskStatus(taskData.status);
      const validatedPriority = validateTaskPriority(taskData.priority);

      // Create the insert data with proper types
      const insertData = {
        title: taskData.title,
        description: taskData.description,
        status: validatedStatus,
        priority: validatedPriority,
        assigned_to: taskData.assigned_to,
        due_date: taskData.due_date,
        school_id: userProfile?.school_id,
        assigned_by: userProfile?.id,
        team_id: taskData.team_id,
      };

      console.log('Validated insert data:', insertData);

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

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...taskData }: Partial<Task> & { id: string }) => {
      console.log('Updating task:', { id, taskData });

      const updateData: any = {};
      
      // Only include fields that exist in the database table
      if (taskData.title !== undefined) updateData.title = taskData.title;
      if (taskData.description !== undefined) updateData.description = taskData.description;
      
      // Validate enum values if they're being updated
      if (taskData.status !== undefined) {
        updateData.status = validateTaskStatus(taskData.status);
      }
      if (taskData.priority !== undefined) {
        updateData.priority = validateTaskPriority(taskData.priority);
      }
      
      if (taskData.assigned_to !== undefined) updateData.assigned_to = taskData.assigned_to;
      if (taskData.due_date !== undefined) updateData.due_date = taskData.due_date;
      if (taskData.team_id !== undefined) updateData.team_id = taskData.team_id;
      if (taskData.completed_at !== undefined) updateData.completed_at = taskData.completed_at;

      console.log('Validated update data:', updateData);

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

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting task:', error);
    },
  });

  return {
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};
