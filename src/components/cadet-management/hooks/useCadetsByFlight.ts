import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FlightCadet {
  id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  rank: string | null;
  flight: string | null;
}

export const useCadetsByFlight = (flight?: string) => {
  const { userProfile } = useAuth();

  const { data: cadets = [], isLoading, error } = useQuery({
    queryKey: ['cadets-by-flight', userProfile?.school_id, flight],
    queryFn: async () => {
      if (!flight) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, grade, rank, flight')
        .eq('school_id', userProfile?.school_id)
        .eq('flight', flight)
        .eq('active', true)
        .in('role', ['cadet', 'command_staff'])
        .order('last_name');

      if (error) {
        console.error('Error fetching cadets by flight:', error);
        throw error;
      }

      return data as FlightCadet[];
    },
    enabled: !!userProfile?.school_id && !!flight,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return { cadets, isLoading, error };
};