import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { IncidentComment } from './types';

export const useIncidentComments = (incidentId: string) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['incident-comments', incidentId],
    queryFn: async () => {
      if (!userProfile?.school_id) {
        throw new Error('User school not found');
      }

      const { data, error } = await supabase
        .from('incident_comments')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching incident comments:', error);
        throw error;
      }
      return data as unknown as IncidentComment[];
    },
    enabled: !!incidentId && !!userProfile?.school_id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!userProfile?.id) {
        throw new Error('User not authenticated');
      }

      const userName = `${userProfile.last_name}, ${userProfile.first_name}`;
      
      const { data, error } = await supabase
        .from('incident_comments')
        .insert({
          incident_id: incidentId,
          user_id: userProfile.id,
          comment_text: commentText,
          is_system_comment: false,
          user_name: userName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-comments', incidentId] });
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

      const userName = `${userProfile.last_name}, ${userProfile.first_name}`;
      
      const { data, error } = await supabase
        .from('incident_comments')
        .insert({
          incident_id: incidentId,
          user_id: userProfile.id,
          comment_text: commentText,
          is_system_comment: true,
          user_name: userName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-comments', incidentId] });
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