import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Subtask } from '../tasks/types';

export const useAllSchoolSubtasksQuery = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['all-school-subtasks', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('subtasks')
        .select(`
          *,
          assigned_to_profile:profiles!subtasks_assigned_to_fkey(id, first_name, last_name, email),
          assigned_by_profile:profiles!subtasks_assigned_by_fkey(id, first_name, last_name, email)
        `)
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all school subtasks:', error);
        throw error;
      }
      return data as Subtask[];
    },
    enabled: !!userProfile?.school_id,
  });
};