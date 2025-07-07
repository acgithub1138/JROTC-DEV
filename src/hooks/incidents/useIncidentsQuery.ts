import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Incident } from './types';

export const useIncidentsQuery = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      if (!userProfile?.school_id) {
        throw new Error('User school not found');
      }

      let query = supabase
        .from('incidents')
        .select(`
          *,
          submitted_by_profile:profiles!incidents_submitted_by_fkey(id, first_name, last_name, email),
          assigned_to_profile:profiles!incidents_assigned_to_fkey(id, first_name, last_name, email)
        `);

      // Only filter by school_id for non-admin users (admins can see all incidents via RLS policy)
      if (userProfile.role !== 'admin') {
        query = query.eq('school_id', userProfile.school_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
        throw error;
      }

      return data as unknown as Incident[];
    },
    enabled: !!userProfile?.school_id,
  });
};