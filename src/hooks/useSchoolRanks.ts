
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Rank {
  id: string;
  rank: string;
  abbreviation: string;
}

export const useSchoolRanks = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['school-ranks', userProfile?.school_id],
    queryFn: async (): Promise<Rank[]> => {
      if (!userProfile?.school_id) {
        throw new Error('No school ID available');
      }

      // Get school data first to access jrotc_program
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('jrotc_program')
        .eq('id', userProfile.school_id)
        .single();

      if (schoolError) throw schoolError;

      if (!schoolData?.jrotc_program) {
        return [];
      }

      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('program', schoolData.jrotc_program)
        .order('rank');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.school_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
