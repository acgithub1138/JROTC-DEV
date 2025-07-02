
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useJobBoardRoles = () => {
  const { userProfile } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['job-board-roles', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_board')
        .select('role')
        .eq('school_id', userProfile?.school_id);

      if (error) {
        console.error('Error fetching job board roles:', error);
        throw error;
      }

      // Get unique roles
      const uniqueRoles = [...new Set(data.map(item => item.role))].filter(Boolean);
      return uniqueRoles;
    },
    enabled: !!userProfile?.school_id,
  });

  return { roles, isLoading };
};
