import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = Database['public']['Enums']['comp_event_type'];

interface PerformanceData {
  date: string;
  [event: string]: number | string;
}

export const useCompetitionReports = (selectedEvents: CompetitionEventType[]) => {
  const { userProfile } = useAuth();
  const [reportData, setReportData] = useState<PerformanceData[]>([]);
  const [availableEvents, setAvailableEvents] = useState<CompetitionEventType[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailableEvents = async () => {
    if (!userProfile?.school_id) {
      setIsLoadingEvents(false);
      return;
    }

    try {
      setIsLoadingEvents(true);
      const { data, error } = await supabase
        .from('competition_events')
        .select('event')
        .eq('school_id', userProfile.school_id);

      if (error) throw error;

      const uniqueEvents = [...new Set(data.map(item => item.event))] as CompetitionEventType[];
      setAvailableEvents(uniqueEvents);
    } catch (error) {
      console.error('Error fetching available events:', error);
      toast.error('Failed to load available events');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchReportData = async () => {
    if (!userProfile?.school_id || selectedEvents.length === 0) {
      setReportData([]);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('competition_events')
        .select(`
          event,
          score_sheet,
          total_points,
          competitions!inner(
            competition_date
          )
        `)
        .eq('school_id', userProfile.school_id)
        .in('event', selectedEvents)
        .order('competitions(competition_date)', { ascending: true });

      if (error) throw error;

      // Process the data to calculate averages per date/event
      const processedData = processCompetitionData(data as any);
      setReportData(processedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const processCompetitionData = (data: any[]): PerformanceData[] => {
    // Group data by date
    const groupedByDate: { [date: string]: { [event: string]: number[] } } = {};

    data.forEach(item => {
      const date = item.competitions.competition_date;
      const event = item.event;
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = {};
      }
      
      if (!groupedByDate[date][event]) {
        groupedByDate[date][event] = [];
      }

      // Extract scores from score_sheet.scores and calculate average
      let averageScore = 0;
      
      if (item.score_sheet?.scores) {
        const scores = Object.values(item.score_sheet.scores) as number[];
        const validScores = scores.filter(score => typeof score === 'number' && !isNaN(score));
        
        if (validScores.length > 0) {
          averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
        }
      } else if (item.total_points) {
        averageScore = item.total_points;
      }

      groupedByDate[date][event].push(averageScore);
    });

    // Convert to chart data format
    const chartData: PerformanceData[] = Object.entries(groupedByDate).map(([date, events]) => {
      const dataPoint: PerformanceData = { date };
      
      Object.entries(events).forEach(([event, scores]) => {
        // Calculate average for this event on this date
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        dataPoint[event] = average;
      });
      
      return dataPoint;
    });

    return chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  useEffect(() => {
    fetchAvailableEvents();
  }, [userProfile?.school_id]);

  useEffect(() => {
    fetchReportData();
  }, [selectedEvents, userProfile?.school_id]);

  return {
    reportData,
    availableEvents,
    isLoading,
    isLoadingEvents,
    refetch: fetchReportData
  };
};