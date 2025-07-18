
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { Task } from './types';

export const useTasksQuery = () => {
  const { userProfile } = useAuth();
  const { canUpdate, canUpdateAssigned } = useTaskPermissions();

  return useQuery({
    queryKey: ['tasks', userProfile?.school_id, canUpdate, canUpdateAssigned],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(id, first_name, last_name, email)
        `);

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
  });
};
