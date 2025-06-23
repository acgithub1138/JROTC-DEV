
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SchoolUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export const useSchoolUsers = () => {
  const { userProfile } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['school-users', userProfile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('school_id', userProfile?.school_id)
        .order('first_name');

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
