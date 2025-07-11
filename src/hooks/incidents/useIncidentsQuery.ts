import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Incident } from './types';
import { useEffect } from 'react';

export const useIncidentsQuery = () => {
  const queryClient = useQueryClient();
  
  console.log('useIncidentsQuery hook called');
  
  // Invalidate cache on mount to ensure fresh data after RLS changes
  useEffect(() => {
    console.log('Invalidating incidents cache for fresh data');
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
  }, [queryClient]);
  
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

      console.log(`Fetched ${data?.length || 0} total incidents:`, data);
      return data as unknown as Incident[];
    },
    staleTime: 0, // Always consider data stale to force fresh fetches
    gcTime: 300000, // Keep in cache for 5 minutes
  });
};