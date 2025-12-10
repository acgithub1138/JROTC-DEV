import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const fetchResourceLocations = async (schoolId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('cp_resource_locations')
    .select('location')
    .eq('school_id', schoolId)
    .order('location', { ascending: true });

  if (error) throw error;

  return data.map(item => item.location);
};

export const useResourceLocations = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = userProfile?.school_id;

  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: ['resource-locations', schoolId],
    queryFn: () => fetchResourceLocations(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes (semi-static data)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['resource-locations', schoolId] });
  };

  return {
    locations,
    isLoading,
    error,
    refetch
  };
};
