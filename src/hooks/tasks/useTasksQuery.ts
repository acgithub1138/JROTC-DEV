
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { Task } from './types';

export const useTasksQuery = () => {
  const { userProfile } = useAuth();
  const { canUpdate, canUpdateAssigned } = useTaskPermissions();

  return useQuery({
    queryKey: ['tasks', userProfile?.school_id, canUpdate, canUpdateAssigned, userProfile?.id],
    queryFn: async () => {
      let query = supabase
        .from('tasks_with_profiles')
        .select('*');

      // If user has update_assigned permission but NOT update permission,
      // they can only see tasks assigned to them
      if (canUpdateAssigned && !canUpdate && userProfile?.id) {
        query = query.eq('assigned_to', userProfile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      return data as Task[];
    },
    enabled: !!userProfile?.school_id,
    staleTime: 30 * 1000, // 30 seconds - tasks change frequently
    gcTime: 2 * 60 * 1000, // 2 minutes cache
  });
};
