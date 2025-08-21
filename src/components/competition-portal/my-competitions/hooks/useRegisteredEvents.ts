import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RegisteredEvent {
  id: string;
  name: string;
}

export const useRegisteredEvents = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<RegisteredEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRegisteredEvents = async () => {
    if (!competitionId || !userProfile?.school_id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cp_event_registrations')
        .select(`
          event_id,
          cp_comp_events!inner(
            id,
            event,
            competition_event_types!event(name)
          )
        `)
        .eq('competition_id', competitionId)
        .eq('school_id', userProfile.school_id)
        .eq('status', 'registered');

      if (error) throw error;

      const registeredEvents = data?.map(reg => ({
        id: reg.event_id,
        name: reg.cp_comp_events?.competition_event_types?.name || 'Unknown Event'
      })) || [];

      setEvents(registeredEvents);
    } catch (error) {
      console.error('Error fetching registered events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredEvents();
  }, [competitionId, userProfile?.school_id]);

  return {
    events,
    isLoading,
    refetch: fetchRegisteredEvents
  };
};