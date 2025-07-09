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

export const useCompetitionReports = (selectedEvent: string | null, selectedCompetitions: string[] | null = null) => {
  const { userProfile } = useAuth();
  const [reportData, setReportData] = useState<PerformanceData[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [availableCompetitions, setAvailableCompetitions] = useState<Array<{ id: string; name: string; competition_date: string }>>([]);
  const [scoringCriteria, setScoringCriteria] = useState<string[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(true);
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

  const fetchAvailableCompetitions = async () => {
    if (!userProfile?.school_id) {
      setIsLoadingCompetitions(false);
      return;
    }

    try {
      setIsLoadingCompetitions(true);
      const { data, error } = await supabase
        .from('competitions')
        .select('id, name, competition_date')
        .eq('school_id', userProfile.school_id)
        .order('competition_date', { ascending: false });

      if (error) throw error;

      setAvailableCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching available competitions:', error);
      toast.error('Failed to load available competitions');
    } finally {
      setIsLoadingCompetitions(false);
    }
  };

  const fetchReportData = async () => {
    if (!userProfile?.school_id || !selectedEvent) {
      console.log('Missing data for fetch:', { school_id: userProfile?.school_id, selectedEvent });
      setReportData([]);
      setScoringCriteria([]);
      return;
    }

    // If no competitions are selected (empty array), don't fetch any data
    if (selectedCompetitions !== null && selectedCompetitions.length === 0) {
      console.log('No competitions selected, clearing data');
      setReportData([]);
      setScoringCriteria([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching report data for event:', selectedEvent);
      
      let query = supabase
        .from('competition_events')
        .select(`
          event,
          score_sheet,
          total_points,
          competition_id,
          competitions!inner(
            id,
            competition_date
          )
        `)
        .eq('school_id', userProfile.school_id)
        .eq('event', selectedEvent as any); // Cast to any to handle string vs enum mismatch
      
      // Filter by specific competitions if selected
      if (selectedCompetitions && selectedCompetitions.length > 0) {
        query = query.in('competition_id', selectedCompetitions);
      }
      
      const { data, error } = await query.order('competitions(competition_date)', { ascending: true });

      if (error) throw error;

      console.log('Raw competition data received:', data);
      console.log('Number of records found:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('Sample score sheet structure:', data[0]?.score_sheet);
      }

      // Process the data to extract scoring criteria and calculate individual criteria performance
      const { processedData, criteria } = processCompetitionData(data as any);
      console.log('Processed criteria:', criteria);
      console.log('Processed data points:', processedData.length);
      
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
    console.log('Formatting criteria name:', rawName);
    
    // Handle the specific format from database: field_X_Y._description
    // Extract the first number from field_X_Y to use as display number
    const fieldMatch = rawName.match(/^field_(\d+)_\d+\.(.*)/);
    
    if (fieldMatch) {
      const displayNumber = fieldMatch[1]; // First number from field_X_Y
      const description = fieldMatch[2]; // Everything after the dot
      
      // Clean up the description part
      const cleanDescription = description
        .replace(/^_/, '') // Remove leading underscore
        .replace(/_/g, ' ') // Convert underscores to spaces
        .replace(/&/g, '&') // Handle special characters
        .replace(/\//g, '/')
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
      
      const formatted = `${displayNumber}. ${cleanDescription}`;
      console.log('Formatted criteria name:', formatted);
      return formatted;
    }
    
    // Fallback for unexpected format
    const formatted = rawName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    console.log('Formatted criteria name (fallback):', formatted);
    return formatted;
  };

  const processCompetitionData = (data: any[]): { processedData: PerformanceData[], criteria: string[] } => {
    console.log('Processing competition data:', data);
    
    if (!data || data.length === 0) {
      console.log('No data to process');
      return { processedData: [], criteria: [] };
    }
    
    // First, collect all unique scoring criteria from all score sheets
    const rawToFormattedCriteriaMap = new Map<string, string>();
    const allFormattedCriteria = new Set<string>();
    
    data.forEach((item, index) => {
      console.log(`Processing item ${index}:`, item);
      
      // Check if score_sheet exists and has the expected structure
      if (!item.score_sheet) {
        console.log(`Item ${index} has no score_sheet`);
        return;
      }
      
      console.log(`Score sheet for item ${index}:`, item.score_sheet);
      
      // Handle different possible structures of score_sheet
      let scoresData = null;
      if (item.score_sheet.scores) {
        scoresData = item.score_sheet.scores;
      } else if (typeof item.score_sheet === 'object') {
        // score_sheet might directly contain the scores
        scoresData = item.score_sheet;
      }
      
      if (scoresData) {
        console.log(`Found scores data for item ${index}:`, scoresData);
        
        const extractCriteriaKeys = (obj: any, prefix = ''): void => {
          console.log(`Extracting from object at prefix "${prefix}":`, obj);
          
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            Object.keys(obj).forEach(key => {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              const value = obj[key];
              
              console.log(`Checking key "${fullKey}" with value:`, value, `(type: ${typeof value})`);
              
              // Accept both numbers and numeric strings
              if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '')) {
                const formattedName = formatCriteriaName(fullKey);
                console.log(`Found criteria: ${fullKey} -> ${formattedName} (value: ${value}, type: ${typeof value})`);
                rawToFormattedCriteriaMap.set(fullKey, formattedName);
                allFormattedCriteria.add(formattedName);
              } else if (typeof value === 'object' && value !== null) {
                extractCriteriaKeys(value, fullKey);
              }
            });
          }
        };
        
        extractCriteriaKeys(scoresData);
      } else {
        console.log(`No scores data found in item ${index}`);
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

      // Handle different possible structures of score_sheet (same logic as criteria extraction)
      let scoresData = null;
      if (item.score_sheet?.scores) {
        scoresData = item.score_sheet.scores;
      } else if (item.score_sheet && typeof item.score_sheet === 'object') {
        scoresData = item.score_sheet;
      }

      if (scoresData) {
        const extractScoresByCriteria = (obj: any, prefix = ''): { [key: string]: number } => {
          const scores: { [key: string]: number } = {};
          
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            Object.entries(obj).forEach(([key, value]) => {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              
              // Accept both numbers and numeric strings, convert to number
              if (typeof value === 'number') {
                scores[fullKey] = value;
              } else if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
                scores[fullKey] = Number(value);
              } else if (typeof value === 'object' && value !== null) {
                Object.assign(scores, extractScoresByCriteria(value, fullKey));
              }
            });
          }
          
          return scores;
        };
        
        const scoresByCriteria = extractScoresByCriteria(scoresData);
        
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
    fetchAvailableCompetitions();
  }, [userProfile?.school_id]);

  useEffect(() => {
    fetchReportData();
  }, [selectedEvent, selectedCompetitions, userProfile?.school_id]);

  return {
    reportData,
    availableEvents,
    availableCompetitions,
    scoringCriteria,
    isLoading,
    isLoadingEvents,
    isLoadingCompetitions,
    refetch: fetchReportData
  };
};