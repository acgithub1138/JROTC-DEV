import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CompetitionEvent } from '../types';

export const useScoreSheetData = (competition: any, open: boolean) => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolMap, setSchoolMap] = useState<Record<string, string>>({});

  const fetchEvents = async () => {
    if (!competition?.id && !competition?.source_competition_id) return;

    try {
      setIsLoading(true);
      
      // Build a permissive query: match either competition_id or source_competition_id for this competition
      const compId = competition.source_competition_id || competition.id;
      const { data, error } = await supabase
        .from('competition_events')
        .select(`
          id,
          event,
          score_sheet,
          total_points,
          cadet_ids,
          team_name,
          school_id,
          competition_id,
          source_competition_id,
          source_type,
          created_at,
          updated_at,
          competition_event_types!inner(
            name
          )
        `)
        .or(`competition_id.eq.${compId},source_competition_id.eq.${compId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Fetched competition events:', data?.length || 0, 'for competition:', compId);

      // Get cadet profiles and school names separately to avoid foreign key issues
      if (data && data.length > 0) {
        // School names
        const uniqueSchoolIds = [...new Set(data.map(event => event.school_id).filter(Boolean))] as string[];
        if (uniqueSchoolIds.length > 0) {
          const { data: schools } = await supabase
            .from('schools')
            .select('id, name')
            .in('id', uniqueSchoolIds);
          const map: Record<string, string> = {};
          (schools || []).forEach(s => { if (s) map[s.id] = s.name; });
          setSchoolMap(map);
        } else {
          setSchoolMap({});
        }

        // Cadet profiles
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
          const judgeA = String(scoreSheetA?.judge_number || '');
          const judgeB = String(scoreSheetB?.judge_number || '');
          
          // If both have judge numbers, sort by them
          if (judgeA && judgeB) {
            // Extract number from "Judge X" format or use numeric value directly
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
        setSchoolMap({});
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
  }, [open, competition]);

  // Add a manual refetch that includes a small delay to ensure database updates are visible
  const refetchWithDelay = async () => {
    setIsLoading(true);
    // Small delay to ensure any pending database updates are committed
    await new Promise(resolve => setTimeout(resolve, 200));
    await fetchEvents();
  };

  return {
    events,
    schoolMap,
    isLoading,
    refetch: refetchWithDelay
  };
};