import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Event } from '../CalendarManagementPage';
import { generateRecurringEvents, validateRecurrenceRule } from '@/utils/recurrence';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

interface EventFilters {
  eventType: string;
  assignedTo: string;
}

export const useEvents = (filters: EventFilters) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { timezone } = useSchoolTimezone();

  const fetchEvents = async (retryCount = 0) => {
    if (!userProfile?.school_id) {
      console.log('No school_id found, user profile:', userProfile);
      setIsLoading(false);
      return;
    }

    console.log('Fetching events for school:', userProfile.school_id, 'with filters:', filters);
    setIsLoading(true);
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          event_types!inner(
            id,
            label,
            color
          ),
          event_assignments(
            id,
            assignee_type,
            assignee_id,
            role,
            status
          )
        `)
        .eq('school_id', userProfile.school_id)
        .order('start_date', { ascending: true });

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database error fetching events:', error);
        throw error;
      }

      console.log('Raw events data:', data);
      
      // Enrich events with assignment names
      if (data && data.length > 0) {
        // Get unique assignee IDs for both teams and cadets
        const teamIds = new Set<string>();
        const cadetIds = new Set<string>();
        
        data.forEach((event: any) => {
          event.event_assignments?.forEach((assignment: any) => {
            if (assignment.assignee_type === 'team') {
              teamIds.add(assignment.assignee_id);
            } else {
              cadetIds.add(assignment.assignee_id);
            }
          });
        });

        // Fetch team and cadet names
        const [teamsResponse, cadetsResponse] = await Promise.all([
          teamIds.size > 0 ? supabase
            .from('teams')
            .select('id, name')
            .in('id', Array.from(teamIds))
            .eq('school_id', userProfile.school_id) : Promise.resolve({ data: [] }),
          cadetIds.size > 0 ? supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', Array.from(cadetIds))
            .eq('school_id', userProfile.school_id)
            .eq('active', true) : Promise.resolve({ data: [] })
        ]);

        const teams = teamsResponse.data || [];
        const cadets = cadetsResponse.data || [];

        // Enrich assignments with names
        const enrichedEvents = data.map((event: any) => ({
          ...event,
          event_assignments: event.event_assignments?.map((assignment: any) => {
            let assignee_name = '';
            if (assignment.assignee_type === 'team') {
              const team = teams.find(t => t.id === assignment.assignee_id);
              assignee_name = team?.name || 'Unknown Team';
            } else {
              const cadet = cadets.find(c => c.id === assignment.assignee_id);
              assignee_name = cadet ? `${cadet.first_name} ${cadet.last_name}` : 'Unknown Cadet';
            }
            return { ...assignment, assignee_name };
          }) || []
        }));

        console.log('Events with enriched assignments:', enrichedEvents);
        setEvents(enrichedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userProfile?.school_id, filters.eventType, filters.assignedTo]);

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'school_id'>) => {
    if (!userProfile?.school_id) return;

    try {
      // Validate recurrence rule if recurring
      if (eventData.is_recurring && eventData.recurrence_rule) {
        const validation = validateRecurrenceRule(eventData.recurrence_rule);
        if (!validation.isValid) {
          toast({
            title: 'Error',
            description: validation.error || 'Invalid recurrence rule',
            variant: 'destructive',
          });
          return;
        }
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          school_id: userProfile.school_id,
          created_by: userProfile.id,
        } as any) // Cast to any due to schema migration
        .select()
        .single();

      if (error) throw error;

      // Generate recurring instances if this is a recurring event
      if (data.is_recurring && data.recurrence_rule) {
        try {
          console.log('Generating recurring instances for event:', data.id, 'with rule:', data.recurrence_rule);
          const recurringInstances = generateRecurringEvents(data, data.recurrence_rule as any, undefined, timezone);
          console.log('Generated instances:', recurringInstances.length, recurringInstances);
          
          if (recurringInstances.length > 0) {
            // Convert instances to match database schema
            const eventsToInsert = recurringInstances.map(instance => ({
              ...instance,
              event_type: instance.event_type // Reference to event_types table
            }));

            const { error: instancesError } = await supabase
              .from('events')
              .insert(eventsToInsert as any); // Cast to any due to schema migration

            if (instancesError) {
              console.error('Error creating recurring instances:', instancesError);
              toast({
                title: 'Warning',
                description: 'Event created but failed to create recurring instances',
                variant: 'destructive',
              });
            } else {
              console.log('Successfully created recurring instances');
            }
          }
        } catch (recurringError) {
          console.error('Error generating recurring instances:', recurringError);
          toast({
            title: 'Warning',
            description: 'Event created but failed to generate recurring instances',
            variant: 'destructive',
          });
        }
      }

      // Refresh events to show all instances
      await fetchEvents();
      
      toast({
        title: 'Success',
        description: data.is_recurring 
          ? 'Recurring event created successfully' 
          : 'Event created successfully',
      });
      
      return data; // Return the created event
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      // Update the parent event
      const { data, error } = await supabase
        .from('events')
        .update(eventData as any) // Cast to any due to schema migration
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If this is a recurring event and recurrence rule was updated, regenerate instances
      if (data.is_recurring && data.recurrence_rule && eventData.recurrence_rule) {
        // Delete existing recurring instances
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .eq('parent_event_id', id);

        if (deleteError) {
          console.error('Error deleting existing recurring instances:', deleteError);
        } else {
          // Generate new recurring instances
          const recurringInstances = generateRecurringEvents(data, data.recurrence_rule as any, undefined, timezone);
          
          if (recurringInstances.length > 0) {
            const { error: insertError } = await supabase
              .from('events')
              .insert(recurringInstances);

            if (insertError) {
              console.error('Error creating recurring instances:', insertError);
            }
          }
        }
      }

      // Refresh events to show all updated instances
      await fetchEvents();
      
      toast({
        title: 'Success',
        description: data.is_recurring 
          ? 'Recurring event updated successfully' 
          : 'Event updated successfully',
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const deleteRecurringSeries = async (parentId: string) => {
    try {
      // Delete all instances of the recurring series
      const { error } = await supabase
        .from('events')
        .delete()
        .or(`id.eq.${parentId},parent_event_id.eq.${parentId}`);

      if (error) throw error;

      // Remove from local state
      setEvents(prev => prev.filter(event => 
        event.id !== parentId && event.parent_event_id !== parentId
      ));
      
      toast({
        title: 'Success',
        description: 'Recurring series deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting recurring series:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete recurring series',
        variant: 'destructive',
      });
    }
  };

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    deleteRecurringSeries,
    refetch: fetchEvents,
  };
};