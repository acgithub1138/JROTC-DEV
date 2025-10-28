import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JudgeAssignment {
  user_id: string;
  judge_id: string;
  assignment_id: string;
  competition_id: string;
  competition_name: string;
  competition_start_date: string;
  competition_end_date: string;
  competition_status: string;
  competition_location: string;
  event_id: string | null;
  event_name: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
  event_location: string | null;
  assignment_details: string | null;
}

export interface CompetitionWithAssignments {
  competition_id: string;
  competition_name: string;
  competition_start_date: string;
  competition_end_date: string;
  competition_status: string;
  competition_location: string;
  assignments: JudgeAssignment[];
}

export const useMyAssignments = () => {
  const {
    data: assignments = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['judge-assignments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.debug('[useMyAssignments] Fetching for user_id:', user.id);

      const { data, error } = await supabase
        .from('cp_judge_assignment_view')
        .select('*')
        .eq('user_id', user.id)
        .order('competition_start_date', { ascending: true })
        .order('event_start_time', { ascending: true })
        .returns<JudgeAssignment[]>();
      
      if (error) {
        console.error('[useMyAssignments] Query error:', error);
        throw error;
      }

      console.debug('[useMyAssignments] Found assignments:', data?.length || 0, data);
      return data || [];
    },
    enabled: true,
    refetchOnMount: true,
    staleTime: 0
  });

  // Group assignments by competition
  const groupedAssignments: CompetitionWithAssignments[] = assignments.reduce((acc, assignment) => {
    const existing = acc.find(c => c.competition_id === assignment.competition_id);
    
    if (existing) {
      existing.assignments.push(assignment);
    } else {
      acc.push({
        competition_id: assignment.competition_id,
        competition_name: assignment.competition_name,
        competition_start_date: assignment.competition_start_date,
        competition_end_date: assignment.competition_end_date,
        competition_status: assignment.competition_status,
        competition_location: assignment.competition_location,
        assignments: [assignment]
      });
    }
    
    return acc;
  }, [] as CompetitionWithAssignments[]);

  return {
    competitions: groupedAssignments,
    isLoading,
    error
  };
};
