import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = string; // Using string instead of enum to handle database values

interface PerformanceData {
  date: string;
  [event: string]: number | string;
}

export const useCompetitionReports = (selectedEvent: string | null) => {
  const { userProfile } = useAuth();
  const [reportData, setReportData] = useState<PerformanceData[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [scoringCriteria, setScoringCriteria] = useState<string[]>([]);
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

      const uniqueEvents = [...new Set(data.map(item => item.event))];
      console.log('Available events:', uniqueEvents);
      setAvailableEvents(uniqueEvents);
    } catch (error) {
      console.error('Error fetching available events:', error);
      toast.error('Failed to load available events');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchReportData = async () => {
    if (!userProfile?.school_id || !selectedEvent) {
      setReportData([]);
      setScoringCriteria([]);
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
        .eq('event', selectedEvent as any) // Cast to any to handle string vs enum mismatch
        .order('competitions(competition_date)', { ascending: true });

      if (error) throw error;

      // Process the data to extract scoring criteria and calculate individual criteria performance
      const { processedData, criteria } = processCompetitionData(data as any);
      setReportData(processedData);
      setScoringCriteria(criteria);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCriteriaName = (rawName: string): string => {
    // Remove field prefixes like "field_1_1." and convert to readable format
    const cleaned = rawName.replace(/^field_\d+_\d+\./, '');
    // Convert underscores to spaces and capitalize words
    return cleaned
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/^\./, ''); // Remove leading dot if present
  };

  const processCompetitionData = (data: any[]): { processedData: PerformanceData[], criteria: string[] } => {
    console.log('Processing competition data:', data);
    
    // First, collect all unique scoring criteria from all score sheets
    const rawToFormattedCriteriaMap = new Map<string, string>();
    const allFormattedCriteria = new Set<string>();
    
    data.forEach(item => {
      if (item.score_sheet?.scores) {
        const extractCriteriaKeys = (obj: any, prefix = ''): void => {
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            Object.keys(obj).forEach(key => {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              const value = obj[key];
              
              if (typeof value === 'number') {
                const formattedName = formatCriteriaName(fullKey);
                rawToFormattedCriteriaMap.set(fullKey, formattedName);
                allFormattedCriteria.add(formattedName);
              } else if (typeof value === 'object' && value !== null) {
                extractCriteriaKeys(value, fullKey);
              }
            });
          }
        };
        
        extractCriteriaKeys(item.score_sheet.scores);
      }
    });

    const criteriaList = Array.from(allFormattedCriteria).sort();
    console.log('Extracted criteria:', criteriaList);
    console.log('Raw to formatted mapping:', rawToFormattedCriteriaMap);
    
    // Group data by date and extract individual scores for each criteria
    const groupedByDate: { [date: string]: { [criteria: string]: number[] } } = {};

    data.forEach(item => {
      const date = item.competitions.competition_date;
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = {};
      }

      if (item.score_sheet?.scores) {
        const extractScoresByCriteria = (obj: any, prefix = ''): { [key: string]: number } => {
          const scores: { [key: string]: number } = {};
          
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            Object.entries(obj).forEach(([key, value]) => {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              
              if (typeof value === 'number') {
                scores[fullKey] = value;
              } else if (typeof value === 'object' && value !== null) {
                Object.assign(scores, extractScoresByCriteria(value, fullKey));
              }
            });
          }
          
          return scores;
        };
        
        const scoresByCriteria = extractScoresByCriteria(item.score_sheet.scores);
        
        // Add scores for each criteria
        Object.entries(scoresByCriteria).forEach(([criteria, score]) => {
          if (!groupedByDate[date][criteria]) {
            groupedByDate[date][criteria] = [];
          }
          groupedByDate[date][criteria].push(score);
        });
      }
    });

    // Convert to chart data format using the mapping
    const chartData: PerformanceData[] = Object.entries(groupedByDate).map(([date, criteriaScores]) => {
      const dataPoint: PerformanceData = { date };
      
      // For each formatted criteria name, find all corresponding raw criteria scores
      criteriaList.forEach(formattedCriteria => {
        const scoresForThisCriteria: number[] = [];
        
        // Find all raw criteria that map to this formatted criteria
        rawToFormattedCriteriaMap.forEach((formatted, raw) => {
          if (formatted === formattedCriteria && criteriaScores[raw]) {
            scoresForThisCriteria.push(...criteriaScores[raw]);
          }
        });
        
        if (scoresForThisCriteria.length > 0) {
          const average = scoresForThisCriteria.reduce((sum, score) => sum + score, 0) / scoresForThisCriteria.length;
          dataPoint[formattedCriteria] = Math.round(average * 100) / 100; // Round to 2 decimal places
        }
      });
      
      return dataPoint;
    });

    const sortedData = chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return {
      processedData: sortedData,
      criteria: criteriaList
    };
  };

  useEffect(() => {
    fetchAvailableEvents();
  }, [userProfile?.school_id]);

  useEffect(() => {
    fetchReportData();
  }, [selectedEvent, userProfile?.school_id]);

  return {
    reportData,
    availableEvents,
    scoringCriteria,
    isLoading,
    isLoadingEvents,
    refetch: fetchReportData
  };
};