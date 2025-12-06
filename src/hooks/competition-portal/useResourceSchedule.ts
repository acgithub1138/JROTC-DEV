import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ResourceAssignment {
  id: string;
  resource_id: string;
  resource_name: string;
  location: string;
  start_time: string;
  end_time: string;
  assignment_details?: string;
}

export interface ResourceTimeline {
  timeSlots: Date[];
  locations: string[];
  getResourcesForSlot: (location: string, timeSlot: Date) => Array<{ name: string; details?: string }>;
}

export const useResourceSchedule = (competitionId?: string) => {
  const [resourceAssignments, setResourceAssignments] = useState<ResourceAssignment[]>([]);
  const [timeline, setTimeline] = useState<ResourceTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResourceSchedule = useCallback(async () => {
    if (!competitionId) return;

    try {
      setIsLoading(true);

      // Fetch resource assignments and competition events in parallel
      const [resourceResult, eventsResult] = await Promise.all([
        supabase
          .from('cp_comp_resources')
          .select(`
            id,
            resource,
            location,
            start_time,
            end_time,
            assignment_details,
            profiles!inner(first_name, last_name)
          `)
          .eq('competition_id', competitionId),
        supabase
          .from('cp_comp_events')
          .select('start_time, end_time, interval')
          .eq('competition_id', competitionId)
      ]);

      if (resourceResult.error) throw resourceResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const resourceData = resourceResult.data;
      const eventsData = eventsResult.data;

      // Process resource assignments
      const assignments: ResourceAssignment[] = resourceData?.map(r => ({
        id: r.id,
        resource_id: r.resource,
        resource_name: `${(r.profiles as any)?.last_name || ''}, ${(r.profiles as any)?.first_name || ''}`.trim() || 'Unknown Resource',
        location: r.location || 'Unknown Location',
        start_time: r.start_time || '',
        end_time: r.end_time || '',
        assignment_details: r.assignment_details
      })) || [];

      setResourceAssignments(assignments);

      // Generate timeline based on competition events (full comp time) rather than just assignments
      if (assignments.length > 0) {
        // Collect all times from both events and assignments
        const allStartTimes: Date[] = [];
        const allEndTimes: Date[] = [];

        // Add event times (for full competition range)
        eventsData?.forEach(event => {
          if (event.start_time) allStartTimes.push(new Date(event.start_time));
          if (event.end_time) allEndTimes.push(new Date(event.end_time));
        });

        // Also include assignment times as fallback
        assignments.forEach(a => {
          if (a.start_time) allStartTimes.push(new Date(a.start_time));
          if (a.end_time) allEndTimes.push(new Date(a.end_time));
        });

        if (allStartTimes.length === 0 || allEndTimes.length === 0) {
          setTimeline(null);
          return;
        }

        const timelineStart = new Date(Math.min(...allStartTimes.map(t => t.getTime())));
        const timelineEnd = new Date(Math.max(...allEndTimes.map(t => t.getTime())));

        // Get interval from events (use first event's interval, default to 15 min)
        const intervalMinutes = eventsData?.find(e => e.interval)?.interval || 15;

        // Generate time slots based on event interval
        const timeSlots: Date[] = [];
        const current = new Date(timelineStart);
        while (current < timelineEnd) {
          timeSlots.push(new Date(current));
          current.setMinutes(current.getMinutes() + intervalMinutes);
        }

        // Get unique locations
        const uniqueLocations = Array.from(new Set(assignments.map(a => a.location))).filter(Boolean);

        const resourceTimeline: ResourceTimeline = {
          timeSlots,
          locations: uniqueLocations,
          getResourcesForSlot: (location: string, timeSlot: Date) => {
            const resources = assignments.filter(a => {
              if (a.location !== location) return false;
              const start = new Date(a.start_time);
              const end = new Date(a.end_time);
              return timeSlot >= start && timeSlot < end;
            });
            return resources.map(r => ({ name: r.resource_name, details: r.assignment_details }));
          }
        };

        setTimeline(resourceTimeline);
      }
    } catch (error) {
      console.error('Error fetching resource schedule:', error);
      toast.error('Failed to load resource schedule');
    } finally {
      setIsLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    if (competitionId) {
      fetchResourceSchedule();
    }
  }, [competitionId, fetchResourceSchedule]);

  return {
    resourceAssignments,
    timeline,
    isLoading,
    refetch: fetchResourceSchedule
  };
};
