import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreateSubtaskData } from '../../tasks/types';

export const useCreateSubtask = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subtaskData: CreateSubtaskData) => {
      const { error } = await supabase
        .from('subtasks')
        .insert({
          ...subtaskData,
          school_id: userProfile?.school_id,
          assigned_by: userProfile?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Subtask created",
        description: "The subtask has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create subtask. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating subtask:', error);
    },
  });
};