import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JudgeAssignment {
  id: string;
  judge_id: string;
  judge_name: string;
  event_id: string;
  event_name: string;
  location?: string;
  start_time: string;
  end_time: string;
}

export interface JudgeTimeline {
  timeSlots: Date[];
  events: Array<{ id: string; name: string; initials: string }>;
  getJudgesForSlot: (eventId: string, timeSlot: Date) => Array<{ name: string; location?: string }>;
  isEventActive: (eventId: string, timeSlot: Date) => boolean;
}

interface JudgeScheduleData {
  judgeAssignments: JudgeAssignment[];
  timeline: JudgeTimeline | null;
}

const fetchJudgeScheduleData = async (competitionId: string): Promise<JudgeScheduleData> => {
  // Fetch judge assignments with judge names and event details
  const { data: judgeData, error: judgeError } = await supabase
    .from('cp_comp_judges')
    .select(`
      id,
      judge,
      event,
      location,
      start_time,
      end_time,
      cp_judges!inner(name),
      cp_comp_events!inner(
        id,
        event,
        interval,
        competition_event_types!inner(name, initials)
      )
    `)
    .eq('competition_id', competitionId);

  if (judgeError) throw judgeError;

  // Process judge assignments
  const assignments: JudgeAssignment[] = judgeData?.map(j => ({
    id: j.id,
    judge_id: j.judge,
    judge_name: (j.cp_judges as any)?.name || 'Unknown Judge',
    event_id: j.event || '',
    event_name: (j.cp_comp_events as any)?.competition_event_types?.name || 'Unknown Event',
    location: j.location,
    start_time: j.start_time || '',
    end_time: j.end_time || ''
  })) || [];

  // Generate timeline
  let timeline: JudgeTimeline | null = null;
  
  if (assignments.length > 0) {
    const startTimes = assignments.map(a => new Date(a.start_time));
    const endTimes = assignments.map(a => new Date(a.end_time));

    const timelineStart = new Date(Math.min(...startTimes.map(t => t.getTime())));
    const timelineEnd = new Date(Math.max(...endTimes.map(t => t.getTime())));

    // Get interval from events (use first event's interval, default to 15 min)
    const eventInterval = judgeData?.find(j => (j.cp_comp_events as any)?.interval)?.cp_comp_events as any;
    const intervalMinutes = eventInterval?.interval || 15;

    // Generate time slots based on event interval
    const timeSlots: Date[] = [];
    const current = new Date(timelineStart);
    while (current < timelineEnd) {
      timeSlots.push(new Date(current));
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }

    // Get unique events
    const uniqueEvents = Array.from(
      new Map(assignments.map(a => {
        const eventData = judgeData?.find(j => j.event === a.event_id);
        const initials = (eventData?.cp_comp_events as any)?.competition_event_types?.initials || '';
        return [a.event_id, { id: a.event_id, name: a.event_name, initials }];
      })).values()
    );

    timeline = {
      timeSlots,
      events: uniqueEvents,
      getJudgesForSlot: (eventId: string, timeSlot: Date) => {
        const matchingAssignments = assignments.filter(a => {
          if (a.event_id !== eventId) return false;
          const start = new Date(a.start_time);
          const end = new Date(a.end_time);
          return timeSlot >= start && timeSlot < end;
        });
        return matchingAssignments.map(a => ({ 
          name: a.judge_name, 
          location: a.location 
        }));
      },
      isEventActive: (eventId: string, timeSlot: Date) => {
        return assignments.some(a => {
          if (a.event_id !== eventId) return false;
          const start = new Date(a.start_time);
          const end = new Date(a.end_time);
          return timeSlot >= start && timeSlot < end;
        });
      }
    };
  }

  return { judgeAssignments: assignments, timeline };
};

export const useJudgeSchedule = (competitionId?: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['judge-schedule', competitionId],
    queryFn: () => fetchJudgeScheduleData(competitionId!),
    enabled: !!competitionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['judge-schedule', competitionId] });
  };

  return {
    judgeAssignments: data?.judgeAssignments || [],
    timeline: data?.timeline || null,
    isLoading,
    error,
    refetch
  };
};
