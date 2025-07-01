
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
      console.log('useSchoolData: Starting fetch for school_id:', userProfile?.school_id);
      
      if (!userProfile?.school_id) {
        console.log('useSchoolData: No school ID available');
        throw new Error('No school ID available');
      }

      // Get school data first to access jrotc_program
      console.log('useSchoolData: Fetching school data...');
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('jrotc_program')
        .eq('id', userProfile.school_id)
        .single();

      if (schoolError) {
        console.error('useSchoolData: School fetch error:', schoolError);
        throw schoolError;
      }

      console.log('useSchoolData: School data fetched:', schoolData);

      if (!schoolData?.jrotc_program) {
        console.log('useSchoolData: No JROTC program set for school');
        return { ranks: [], jobRoles: [] };
      }

      console.log('useSchoolData: Fetching ranks and job roles for program:', schoolData.jrotc_program);

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

      console.log('useSchoolData: Raw ranks query result:', ranksResult);
      console.log('useSchoolData: Raw job roles query result:', jobRolesResult);

      if (ranksResult.error) {
        console.error('useSchoolData: Ranks fetch error:', ranksResult.error);
        throw ranksResult.error;
      }
      if (jobRolesResult.error) {
        console.error('useSchoolData: Job roles fetch error:', jobRolesResult.error);
        throw jobRolesResult.error;
      }

      console.log('useSchoolData: Ranks fetched:', ranksResult.data?.length || 0, 'records');
      console.log('useSchoolData: Job roles fetched:', jobRolesResult.data?.length || 0, 'records');

      // Check if we have data in the database at all
      const { data: allRanks } = await supabase
        .from('ranks')
        .select('*')
        .limit(5);
      
      const { data: allJobRoles } = await supabase
        .from('job_board_roles')
        .select('*')
        .limit(5);

      console.log('useSchoolData: Total ranks in database (sample):', allRanks?.length || 0, allRanks);
      console.log('useSchoolData: Total job roles in database (sample):', allJobRoles?.length || 0, allJobRoles);

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
