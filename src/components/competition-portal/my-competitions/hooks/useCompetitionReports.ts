import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { CriteriaMapping } from '../components/reports/AdvancedCriteriaMapping';

type CompetitionEventType = string; // Using string instead of enum to handle database values

interface PerformanceData {
  date: string;
  [event: string]: number | string;
}

export const useCompetitionReports = (selectedEvent: string | null, selectedCompetitions: string[] | null = null, criteriaMapping?: CriteriaMapping[]) => {
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
        .select(`
          event,
          competition_event_types!inner(
            name
          )
        `)
        .eq('school_id', userProfile.school_id);

      if (error) throw error;

      const uniqueEvents = [...new Set(data.map(item => item.competition_event_types?.name).filter(Boolean))];
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
      
      // Fetch both internal competitions and portal competitions
      const [internalComps, portalComps] = await Promise.all([
        supabase
          .from('competitions')
          .select('id, name, competition_date')
          .eq('school_id', userProfile.school_id),
        supabase
          .from('cp_competitions')
          .select('id, name, start_date')
          .eq('school_id', userProfile.school_id)
      ]);

      if (internalComps.error) throw internalComps.error;
      if (portalComps.error) throw portalComps.error;

      // Combine and normalize the data
      const allCompetitions = [
        ...(internalComps.data || []).map(comp => ({
          id: comp.id,
          name: comp.name,
          competition_date: comp.competition_date
        })),
        ...(portalComps.data || []).map(comp => ({
          id: comp.id,
          name: comp.name,
          competition_date: comp.start_date // Use start_date as competition_date for portal comps
        }))
      ];

      // Sort by competition date descending
      const sortedCompetitions = allCompetitions.sort((a, b) => 
        new Date(b.competition_date).getTime() - new Date(a.competition_date).getTime()
      );

      setAvailableCompetitions(sortedCompetitions);
    } catch (error) {
      console.error('Error fetching available competitions:', error);
      toast.error('Failed to load available competitions');
    } finally {
      setIsLoadingCompetitions(false);
    }
  };

  const fetchReportData = async () => {
    if (!userProfile?.school_id || !selectedEvent) {
      setReportData([]);
      setScoringCriteria([]);
      return;
    }

    // If no competitions are selected (empty array), don't fetch any data
    if (selectedCompetitions !== null && selectedCompetitions.length === 0) {
      setReportData([]);
      setScoringCriteria([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      let query = supabase
        .from('competition_events')
        .select(`
          event,
          score_sheet,
          total_points,
          competition_id,
          source_competition_id,
          competitions(
            id,
            competition_date
          ),
          competition_event_types!inner(
            name
          )
        `)
        .eq('school_id', userProfile.school_id)
        .eq('competition_event_types.name', selectedEvent);
      
      // Filter by specific competitions if selected (check both competition_id and source_competition_id)
      if (selectedCompetitions && selectedCompetitions.length > 0) {
        query = query.or(`competition_id.in.(${selectedCompetitions.join(',')}),source_competition_id.in.(${selectedCompetitions.join(',')})`);
      }
      
      const { data, error } = await query;

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
    // Handle numbered criteria: field_X_Y._description
    const numberedMatch = rawName.match(/^field_(\d+)_(\d+)\.(.*)/);
    
    if (numberedMatch) {
      const displayNumber = numberedMatch[1]; // First number from field_X_Y
      const description = numberedMatch[3]; // Everything after the dot
      
      // Clean up the description part
      const cleanDescription = description
        .replace(/^_/, '') // Remove leading underscore
        .replace(/_/g, ' ') // Convert underscores to spaces
        .replace(/&/g, '&') // Handle special characters
        .replace(/\//g, '/')
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
      
      const formatted = `${displayNumber}. ${cleanDescription}`;
      return formatted;
    }
    
    // Handle penalty fields: field_X_description (without dot and second number)
    const penaltyMatch = rawName.match(/^field_(\d+)_(.*)/);
    
    if (penaltyMatch) {
      const description = penaltyMatch[2];
      
      // Clean up the penalty description
      const cleanDescription = description
        .replace(/_/g, ' ') // Convert underscores to spaces
        .replace(/&/g, '&') // Handle special characters
        .replace(/\//g, '/')
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
      
      const formatted = cleanDescription;
      return formatted;
    }
    
    // Fallback for unexpected format
    const formatted = rawName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return formatted;
  };

  const processCompetitionData = (data: any[]): { processedData: PerformanceData[], criteria: string[] } => {
    if (!data || data.length === 0) {
      return { processedData: [], criteria: [] };
    }
    
    // First, collect all unique scoring criteria from all score sheets
    const rawToFormattedCriteriaMap = new Map<string, string>();
    const allFormattedCriteria = new Set<string>();
    
    data.forEach((item) => {
      // Check if score_sheet exists and has the expected structure
      if (!item.score_sheet) {
        return;
      }
      
      // Handle different possible structures of score_sheet
      let scoresData = null;
      if (item.score_sheet.scores) {
        scoresData = item.score_sheet.scores;
      } else if (typeof item.score_sheet === 'object') {
        // score_sheet might directly contain the scores
        scoresData = item.score_sheet;
      }
      
      if (scoresData) {
        const extractCriteriaKeys = (obj: any, prefix = ''): void => {
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            Object.keys(obj).forEach(key => {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              const value = obj[key];
              
              // Accept both numbers and numeric strings
              if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '')) {
                const formattedName = formatCriteriaName(fullKey);
                rawToFormattedCriteriaMap.set(fullKey, formattedName);
                allFormattedCriteria.add(formattedName);
              } else if (typeof value === 'object' && value !== null) {
                extractCriteriaKeys(value, fullKey);
              }
            });
          }
        };
        
        extractCriteriaKeys(scoresData);
      }
    });

    // Apply criteria mappings if provided
    let finalCriteriaMap = rawToFormattedCriteriaMap;
    if (criteriaMapping && criteriaMapping.length > 0) {
      // Create reverse mapping from original criteria to display names
      const originalToDisplay = new Map<string, string>();
      criteriaMapping.forEach(mapping => {
        mapping.original_criteria.forEach(original => {
          originalToDisplay.set(original, mapping.display_name);
        });
      });

      // Apply mappings to the criteria map
      const mappedCriteriaMap = new Map<string, string>();
      const mappedFormattedCriteria = new Set<string>();
      
      rawToFormattedCriteriaMap.forEach((formatted, raw) => {
        const displayName = originalToDisplay.get(formatted);
        if (displayName) {
          mappedCriteriaMap.set(raw, displayName);
          mappedFormattedCriteria.add(displayName);
        } else {
          mappedCriteriaMap.set(raw, formatted);
          mappedFormattedCriteria.add(formatted);
        }
      });
      
      finalCriteriaMap = mappedCriteriaMap;
      allFormattedCriteria.clear();
      mappedFormattedCriteria.forEach(criteria => allFormattedCriteria.add(criteria));
    }

    const criteriaList = Array.from(allFormattedCriteria).sort();
    
    // Group data by date and extract individual scores for each criteria
    const groupedByDate: { [date: string]: { [criteria: string]: number[] } } = {};

    data.forEach(item => {
      // Handle null competitions from left join
      const date = item.competitions?.competition_date || 'Unknown Date';
      
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
        finalCriteriaMap.forEach((formatted, raw) => {
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
  }, [selectedEvent, selectedCompetitions, userProfile?.school_id, criteriaMapping]);

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
