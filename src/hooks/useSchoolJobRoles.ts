
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface JobRole {
  id: string;
  role: string;
}

export const useSchoolJobRoles = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['school-job-roles', userProfile?.school_id],
    queryFn: async (): Promise<JobRole[]> => {
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
        .from('job_board_roles')
        .select('*')
        .eq('program', schoolData.jrotc_program)
        .order('role');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.school_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
