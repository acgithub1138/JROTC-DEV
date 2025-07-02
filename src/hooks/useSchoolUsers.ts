
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

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['school-users', userProfile?.school_id, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, grade, active')
        .eq('school_id', userProfile?.school_id)
        .order('first_name');

      if (activeOnly !== undefined) {
        query = query.eq('active', activeOnly);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching school users:', error);
        throw error;
      }
      return data as SchoolUser[];
    },
    enabled: !!userProfile?.school_id,
  });

  return { users, isLoading };
};
