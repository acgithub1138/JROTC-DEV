
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TaskStatusOption {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
  school_id: string;
}

export const useTaskStatusOptions = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statusOptions = [], isLoading } = useQuery({
    queryKey: ['task-status-options', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_status_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as TaskStatusOption[];
    },
    enabled: !!userProfile?.school_id,
  });

  const createStatusOption = useMutation({
    mutationFn: async (optionData: Omit<TaskStatusOption, 'id' | 'school_id'>) => {
      const { data, error } = await supabase
        .from('task_status_options')
        .insert({
          ...optionData,
          school_id: userProfile?.school_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-status-options'] });
      toast({
        title: "Status option created",
        description: "The status option has been created successfully.",
      });
    },
  });

  const updateStatusOption = useMutation({
    mutationFn: async ({ id, ...optionData }: Partial<TaskStatusOption> & { id: string }) => {
      const { data, error } = await supabase
        .from('task_status_options')
        .update(optionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-status-options'] });
      toast({
        title: "Status option updated",
        description: "The status option has been updated successfully.",
      });
    },
  });

  const deleteStatusOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_status_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-status-options'] });
      toast({
        title: "Status option deleted",
        description: "The status option has been deleted successfully.",
      });
    },
  });

  return {
    statusOptions,
    isLoading,
    createStatusOption: createStatusOption.mutate,
    updateStatusOption: updateStatusOption.mutate,
    deleteStatusOption: deleteStatusOption.mutate,
  };
};
