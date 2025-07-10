import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSubtaskSystemComments = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const handleSystemComment = async (subtaskId: string, commentText: string) => {
    try {
      const { error } = await supabase
        .from('subtask_comments')
        .insert({
          subtask_id: subtaskId,
          user_id: userProfile?.id,
          comment_text: commentText,
          is_system_comment: true,
        });

      if (error) {
        console.error('Error adding subtask system comment:', error);
        return;
      }

      // Invalidate the subtask comments query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['subtask-comments', subtaskId] });
    } catch (error) {
      console.error('Failed to add subtask system comment:', error);
    }
  };

  return { handleSystemComment };
};