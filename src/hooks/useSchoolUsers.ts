
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SchoolUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  grade: string | null;
  active: boolean;
}

export const useSchoolUsers = (activeOnly?: boolean) => {
  const { userProfile } = useAuth();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['school-users', userProfile?.school_id, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, grade, active')
        .eq('school_id', userProfile?.school_id)
        .order('last_name');

      if (activeOnly !== undefined) {
        query = query.eq('active', activeOnly);
        // When filtering for active users, also filter for users with grades
        if (activeOnly === true) {
          query = query.not('grade', 'is', null);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching school users:', error);
        throw error;
      }
      return data as SchoolUser[];
    },
    enabled: !!userProfile?.school_id,
    staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (renamed from cacheTime in v5)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    retry: 2, // Retry failed requests twice
  });

  return { users, isLoading, error };
};
