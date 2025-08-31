import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCommentEmailService } from '@/hooks/email/useCommentEmailService';

export interface SubtaskComment {
  id: string;
  subtask_id: string;
  user_id: string;
  comment_text: string;
  is_system_comment: boolean;
  created_at: string;
  user_profile?: {
    first_name: string;
    last_name: string;
  };
}

export const useSubtaskComments = (subtaskId: string) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { processCommentEmailRules } = useCommentEmailService();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['subtask-comments', subtaskId],
    queryFn: async () => {
      if (!userProfile?.school_id) {
        throw new Error('User school not found');
      }

      const { data, error } = await supabase
        .from('subtask_comments')
        .select(`
          *,
          user_profile:user_id(first_name, last_name)
        `)
        .eq('subtask_id', subtaskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching subtask comments:', error);
        throw error;
      }
      return data as SubtaskComment[];
    },
    enabled: !!subtaskId && !!userProfile?.school_id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!userProfile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('subtask_comments')
        .insert({
          subtask_id: subtaskId,
          user_id: userProfile.id,
          comment_text: commentText,
          is_system_comment: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtask-comments', subtaskId] });
      
      // Trigger email notification for comment
      if (userProfile?.id && userProfile?.school_id) {
        processCommentEmailRules({
          sourceTable: 'subtasks',
          recordId: subtaskId,
          schoolId: userProfile.school_id,
          commenterId: userProfile.id,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding comment:', error);
    },
  });

  const addSystemCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!userProfile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('subtask_comments')
        .insert({
          subtask_id: subtaskId,
          user_id: userProfile.id,
          comment_text: commentText,
          is_system_comment: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtask-comments', subtaskId] });
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutate,
    addSystemComment: addSystemCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
  };
};