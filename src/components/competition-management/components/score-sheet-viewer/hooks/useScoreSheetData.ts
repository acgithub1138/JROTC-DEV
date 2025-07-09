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
          cadet_ids,
          team_name,
          created_at
        `)
        .eq('competition_id', competition.id)
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get cadet profiles separately to avoid foreign key issues
      if (data && data.length > 0) {
        const allCadetIds = [...new Set(data.flatMap(event => event.cadet_ids))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', allCadetIds);

        // Map profiles to events
        const eventsWithProfiles = data.map(event => ({
          ...event,
          profiles: profiles?.filter(p => event.cadet_ids.includes(p.id)) || []
        }));
        
        // Sort events to maintain consistent order: by judge number if available, then by creation date
        const sortedEvents = eventsWithProfiles.sort((a, b) => {
          const scoreSheetA = a.score_sheet as any;
          const scoreSheetB = b.score_sheet as any;
          const judgeA = scoreSheetA?.judge_number || '';
          const judgeB = scoreSheetB?.judge_number || '';
          
          // If both have judge numbers, sort by them
          if (judgeA && judgeB) {
            // Extract number from "Judge X" format
            const numA = parseInt(judgeA.replace(/\D/g, '')) || 0;
            const numB = parseInt(judgeB.replace(/\D/g, '')) || 0;
            if (numA !== numB) return numA - numB;
          }
          
          // If only one has judge number, prioritize it
          if (judgeA && !judgeB) return -1;
          if (!judgeA && judgeB) return 1;
          
          // Fallback to creation date
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        
        setEvents(sortedEvents);
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