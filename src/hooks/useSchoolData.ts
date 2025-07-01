
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SchoolData {
  ranks: Array<{ id: string; rank: string; abbreviation: string }>;
  jobRoles: Array<{ id: string; role: string }>;
}

export const useSchoolData = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['school-data', userProfile?.school_id],
    queryFn: async (): Promise<SchoolData> => {
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
        return { ranks: [], jobRoles: [] };
      }

      // Fetch ranks and job roles in parallel
      const [ranksResult, jobRolesResult] = await Promise.all([
        supabase
          .from('ranks')
          .select('*')
          .eq('program', schoolData.jrotc_program)
          .order('rank'),
        supabase
          .from('job_board_roles')
          .select('*')
          .eq('program', schoolData.jrotc_program)
          .order('role')
      ]);

      if (ranksResult.error) throw ranksResult.error;
      if (jobRolesResult.error) throw jobRolesResult.error;

      return {
        ranks: ranksResult.data || [],
        jobRoles: jobRolesResult.data || []
      };
    },
    enabled: !!userProfile?.school_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
