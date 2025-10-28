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

      const { data: rawAssignments, error: assignmentsError } = await supabase
        .from('cp_comp_judges')
        .select('id, competition_id, judge, assignment_details, location, event, start_time, end_time')
        .eq('judge', user.id);
      
      if (assignmentsError) throw assignmentsError;
      if (!rawAssignments || rawAssignments.length === 0) return [] as JudgeAssignment[];
      
      const competitionIds = Array.from(new Set(rawAssignments.map(a => a.competition_id).filter(Boolean)));
      const eventIds = Array.from(new Set(rawAssignments.map(a => a.event).filter(Boolean)));
      
      const [compsRes, eventsRes] = await Promise.all([
        competitionIds.length
          ? supabase
              .from('cp_competitions')
              .select('id, name, start_date, end_date, status, location')
              .in('id', competitionIds as string[])
          : Promise.resolve({ data: [], error: null } as { data: any[]; error: any }),
        eventIds.length
          ? supabase
              .from('cp_events')
              .select('id, name')
              .in('id', eventIds as string[])
          : Promise.resolve({ data: [], error: null } as { data: any[]; error: any })
      ]);
      
      if (compsRes.error) throw compsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      
      const compMap = new Map((compsRes.data as any[]).map((c: any) => [c.id, c]));
      const eventMap = new Map((eventsRes.data as any[]).map((e: any) => [e.id, e]));
      
      const mapped = (rawAssignments as any[]).map((a: any) => {
        const comp = a.competition_id ? compMap.get(a.competition_id) : null;
        const ev = a.event ? eventMap.get(a.event) : null;
        const toStr = (v: any) => (v === null || v === undefined ? null : String(v));
        return {
          user_id: user.id,
          judge_id: toStr(a.judge)!,
          assignment_id: toStr(a.id)!,
          competition_id: toStr(a.competition_id)!,
          competition_name: comp?.name ?? '',
          competition_start_date: comp?.start_date ?? '',
          competition_end_date: comp?.end_date ?? '',
          competition_status: comp?.status ?? '',
          competition_location: comp?.location ?? '',
          event_id: (a.event ? toStr(a.event) : null),
          event_name: (ev?.name ?? null),
          event_start_time: (a.start_time ? toStr(a.start_time) : null),
          event_end_time: (a.end_time ? toStr(a.end_time) : null),
          event_location: (a.location ? toStr(a.location) : null),
          assignment_details: (a.assignment_details ? toStr(a.assignment_details) : null)
        } as JudgeAssignment;
      });
      
      const time = (s: string | null) => (s ? new Date(s).getTime() : 0);
      mapped.sort((a, b) => {
        const c = time(a.competition_start_date) - time(b.competition_start_date);
        if (c !== 0) return c;
        return time(a.event_start_time) - time(b.event_start_time);
      });
      
      return mapped as JudgeAssignment[];
    }
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
