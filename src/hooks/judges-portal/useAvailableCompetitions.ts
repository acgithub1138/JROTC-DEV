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
  judges_needed: number;
  judges_approved: number;
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
      // Get public competitions in draft or open status with upcoming start dates
      const { data: comps, error: compsError } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('is_public', true)
        .in('status', ['draft', 'open'])
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });
      
      if (compsError) throw compsError;
      
      // For each competition, get judges needed and approved count
      const competitionsWithJudges = await Promise.all(
        comps.map(async (comp) => {
          // Get total judges needed from events
          const { data: events } = await supabase
            .from('cp_comp_events')
            .select('*')
            .eq('competition_id', comp.id);
          
          const judgesNeeded = events?.reduce((sum: number, event: any) => sum + (Number(event.judges_needed) || 0), 0) || 0;
          
          // Get approved judge applications count
          const { count: approvedCount } = await supabase
            .from('cp_judge_competition_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('competition_id', comp.id)
            .eq('status', 'approved');
          
          return {
            ...comp,
            judges_needed: judgesNeeded,
            judges_approved: approvedCount || 0
          };
        })
      );
      
      return competitionsWithJudges as AvailableCompetition[];
    }
  });

  return {
    competitions,
    isLoading,
    error
  };
};
