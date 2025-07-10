import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useTaskSystemComments = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const handleSystemComment = async (taskId: string, commentText: string) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userProfile?.id,
          comment_text: commentText,
          is_system_comment: true,
        });

      if (error) {
        console.error('Error adding system comment:', error);
        return;
      }

      // Invalidate the task comments query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    } catch (error) {
      console.error('Failed to add system comment:', error);
    }
  };

  return { handleSystemComment };
};