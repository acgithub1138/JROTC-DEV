import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Incident } from './types';

export const useIncidentsQuery = () => {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      console.log('Fetching all incidents - RLS disabled');

      // Simple query to fetch all incidents without any auth complexity
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} total incidents`);
      return data as unknown as Incident[];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
};