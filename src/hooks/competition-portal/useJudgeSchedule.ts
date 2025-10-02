import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  events: Array<{ id: string; name: string }>;
  getJudgeForSlot: (eventId: string, timeSlot: Date) => { name: string; location?: string } | null;
  isEventActive: (eventId: string, timeSlot: Date) => boolean;
}

export const useJudgeSchedule = (competitionId?: string) => {
  const [judgeAssignments, setJudgeAssignments] = useState<JudgeAssignment[]>([]);
  const [timeline, setTimeline] = useState<JudgeTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJudgeSchedule = useCallback(async () => {
    if (!competitionId) return;

    try {
      setIsLoading(true);

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
          cp_judges!inner(name)
        `)
        .eq('competition_id', competitionId);

      if (judgeError) throw judgeError;

      // Fetch event types
      const eventIds = judgeData?.map(j => j.event).filter(Boolean) || [];
      const { data: eventTypesData, error: eventTypesError } = await supabase
        .from('competition_event_types')
        .select('id, name')
        .in('id', eventIds);

      if (eventTypesError) throw eventTypesError;

      const eventTypesMap = new Map(
        eventTypesData?.map(et => [et.id, et.name]) || []
      );

      // Process judge assignments
      const assignments: JudgeAssignment[] = judgeData?.map(j => ({
        id: j.id,
        judge_id: j.judge,
        judge_name: (j.cp_judges as any)?.name || 'Unknown Judge',
        event_id: j.event || '',
        event_name: eventTypesMap.get(j.event || '') || 'Unknown Event',
        location: j.location,
        start_time: j.start_time || '',
        end_time: j.end_time || ''
      })) || [];

      setJudgeAssignments(assignments);

      // Generate timeline
      if (assignments.length > 0) {
        const startTimes = assignments.map(a => new Date(a.start_time));
        const endTimes = assignments.map(a => new Date(a.end_time));

        const timelineStart = new Date(Math.min(...startTimes.map(t => t.getTime())));
        const timelineEnd = new Date(Math.max(...endTimes.map(t => t.getTime())));

        // Generate 15-minute intervals
        const timeSlots: Date[] = [];
        const current = new Date(timelineStart);
        while (current < timelineEnd) {
          timeSlots.push(new Date(current));
          current.setMinutes(current.getMinutes() + 15);
        }

        // Get unique events
        const uniqueEvents = Array.from(
          new Map(assignments.map(a => [a.event_id, { id: a.event_id, name: a.event_name }])).values()
        );

        const judgeTimeline: JudgeTimeline = {
          timeSlots,
          events: uniqueEvents,
          getJudgeForSlot: (eventId: string, timeSlot: Date) => {
            const assignment = assignments.find(a => {
              if (a.event_id !== eventId) return false;
              const start = new Date(a.start_time);
              const end = new Date(a.end_time);
              return timeSlot >= start && timeSlot < end;
            });
            return assignment ? { name: assignment.judge_name, location: assignment.location } : null;
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

        setTimeline(judgeTimeline);
      }
    } catch (error) {
      console.error('Error fetching judge schedule:', error);
      toast.error('Failed to load judge schedule');
    } finally {
      setIsLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    if (competitionId) {
      fetchJudgeSchedule();
    }
  }, [competitionId, fetchJudgeSchedule]);

  return {
    judgeAssignments,
    timeline,
    isLoading,
    refetch: fetchJudgeSchedule
  };
};
