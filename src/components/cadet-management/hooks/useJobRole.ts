import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useJobRole = (profileId?: string) => {
  const { data: jobRole, isLoading } = useQuery({
    queryKey: ['job-role', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      const { data, error } = await supabase
        .from('job_board')
        .select('role')
        .eq('cadet_id', profileId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching job role:', error);
        return null;
      }

      return data?.role || null;
    },
    enabled: !!profileId,
  });

  return { jobRole, isLoading };
};