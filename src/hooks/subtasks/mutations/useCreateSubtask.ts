import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEmailService } from '@/hooks/email/useEmailService';
import { CreateSubtaskData } from '../../tasks/types';

export const useCreateSubtask = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const { queueEmail } = useEmailService();

  return useMutation({
    mutationFn: async (subtaskData: CreateSubtaskData) => {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          ...subtaskData,
          school_id: userProfile?.school_id,
          assigned_by: userProfile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Subtask created",
        description: "The subtask has been created successfully.",
      });
      
      // Trigger subtask_created email if assigned_to is set
      if (data?.assigned_to && userProfile?.school_id) {
        queueEmail({
          templateId: '', // Backend will resolve based on rule
          recipientEmail: '', // Backend will resolve from assigned_to
          sourceTable: 'subtasks',
          recordId: data.id,
          schoolId: userProfile.school_id,
        });
      }
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