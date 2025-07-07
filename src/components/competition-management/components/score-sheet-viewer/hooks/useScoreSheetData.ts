import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CompetitionEvent } from '../types';

export const useScoreSheetData = (competition: any, open: boolean) => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async () => {
    if (!userProfile?.school_id || !competition?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('competition_events')
        .select(`
          id,
          event,
          score_sheet,
          total_points,
          cadet_id
        `)
        .eq('competition_id', competition.id)
        .eq('school_id', userProfile.school_id);

      if (error) throw error;

      // Get cadet profiles separately to avoid foreign key issues
      if (data && data.length > 0) {
        const cadetIds = data.map(event => event.cadet_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', cadetIds);

        // Map profiles to events
        const eventsWithProfiles = data.map(event => ({
          ...event,
          profiles: profiles?.find(p => p.id === event.cadet_id)
        }));
        
        setEvents(eventsWithProfiles);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching competition events:', error);
      toast.error('Failed to load competition events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && competition) {
      fetchEvents();
    }
  }, [open, competition, userProfile?.school_id]);

  return {
    events,
    isLoading,
    refetch: fetchEvents
  };
};