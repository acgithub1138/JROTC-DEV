import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvailableCompetition {
  id: string;
  name: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  hosting_school: string | null;
  program: string | null;
  status: string;
  is_public: boolean;
  school_id: string;
}

export const useAvailableCompetitions = () => {
  const {
    data: competitions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['available-competitions'],
    queryFn: async () => {
      // Get public competitions that are published and upcoming
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'open')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data as AvailableCompetition[];
    }
  });

  return {
    competitions,
    isLoading,
    error
  };
};
