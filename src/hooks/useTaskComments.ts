
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { TaskComment } from './useTasks';

export const useTaskComments = (taskId: string) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      if (!userProfile?.school_id) {
        throw new Error('User school not found');
      }

      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user_profile:user_id(first_name, last_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching task comments:', error);
        throw error;
      }
      return data as TaskComment[];
    },
    enabled: !!taskId && !!userProfile?.school_id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!userProfile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
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
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
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
        .from('task_comments')
        .insert({
          task_id: taskId,
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
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
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
