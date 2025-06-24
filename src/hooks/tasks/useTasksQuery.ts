
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from './types';

export const useTasksQuery = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['tasks', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      return data as Task[];
    },
    enabled: !!userProfile?.school_id,
  });
};
