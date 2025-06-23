
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TaskPriorityOption {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

export const useTaskPriorityOptions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: priorityOptions = [], isLoading } = useQuery({
    queryKey: ['task-priority-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_priority_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as TaskPriorityOption[];
    },
  });

  const createPriorityOption = useMutation({
    mutationFn: async (optionData: Omit<TaskPriorityOption, 'id'>) => {
      const { data, error } = await supabase
        .from('task_priority_options')
        .insert(optionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-priority-options'] });
      toast({
        title: "Priority option created",
        description: "The priority option has been created successfully.",
      });
    },
  });

  const updatePriorityOption = useMutation({
    mutationFn: async ({ id, ...optionData }: Partial<TaskPriorityOption> & { id: string }) => {
      const { data, error } = await supabase
        .from('task_priority_options')
        .update(optionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-priority-options'] });
      toast({
        title: "Priority option updated",
        description: "The priority option has been updated successfully.",
      });
    },
  });

  const deletePriorityOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_priority_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-priority-options'] });
      toast({
        title: "Priority option deleted",
        description: "The priority option has been deleted successfully.",
      });
    },
  });

  return {
    priorityOptions,
    isLoading,
    createPriorityOption: createPriorityOption.mutate,
    updatePriorityOption: updatePriorityOption.mutate,
    deletePriorityOption: deletePriorityOption.mutate,
  };
};
