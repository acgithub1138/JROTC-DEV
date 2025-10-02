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

      // Fetch resource assignments
      const { data: resourceData, error: resourceError } = await supabase
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
        .eq('competition_id', competitionId);

      if (resourceError) throw resourceError;

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
