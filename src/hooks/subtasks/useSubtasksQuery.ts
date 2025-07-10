import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Subtask } from '../tasks/types';

export const useSubtasksQuery = (parentTaskId?: string) => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['subtasks', parentTaskId, userProfile?.school_id],
    queryFn: async () => {
      if (!parentTaskId) return [];
      
      const { data, error } = await supabase
        .from('subtasks')
        .select(`
          *,
          assigned_to_profile:profiles!subtasks_assigned_to_fkey(id, first_name, last_name, email),
          assigned_by_profile:profiles!subtasks_assigned_by_fkey(id, first_name, last_name, email)
        `)
        .eq('parent_task_id', parentTaskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subtasks:', error);
        throw error;
      }
      return data as Subtask[];
    },
    enabled: !!userProfile?.school_id && !!parentTaskId,
  });
};