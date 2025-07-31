import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CriteriaMapping } from '../components/reports/AdvancedCriteriaMapping';

interface UseCriteriaMappingProps {
  selectedEvent: string | null;
  originalCriteria: string[];
}

// Utility function to sort criteria by number prefix
export const sortCriteriaByNumber = (criteria: string[]): string[] => {
  return criteria.sort((a, b) => {
    // Extract numbers from criteria names for proper ordering
    const getNumber = (criteria: string): number => {
      const match = criteria.match(/^(\d+)\./);
      return match ? parseInt(match[1], 10) : 999; // Put non-numbered items at the end
    };
    
    const aNum = getNumber(a);
    const bNum = getNumber(b);
    
    // If both have numbers, sort by number
    if (aNum !== 999 && bNum !== 999) {
      return aNum - bNum;
    }
    
    // If only one has a number, numbered item comes first
    if (aNum !== 999) return -1;
    if (bNum !== 999) return 1;
    
    // If neither has a number, sort alphabetically
    return a.localeCompare(b);
  });
};

export const useCriteriaMapping = ({ selectedEvent, originalCriteria }: UseCriteriaMappingProps) => {
  const { userProfile } = useAuth();
  const [mappings, setMappings] = useState<CriteriaMapping[]>([]);
  const [similarMappings, setSimilarMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load mappings from database when event changes
  useEffect(() => {
    if (selectedEvent && userProfile?.school_id) {
      loadMappings();
    }
  }, [selectedEvent, userProfile?.school_id]);

  const loadMappings = async () => {
    if (!selectedEvent || !userProfile?.school_id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('criteria_mappings')
        .select('*')
        .eq('event_type', selectedEvent)
        .or(`school_id.eq.${userProfile.school_id},is_global.eq.true`)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      // Convert database format to component format
      const formattedMappings: CriteriaMapping[] = data.map(mapping => ({
        id: mapping.id,
        displayName: mapping.display_name,
        originalCriteria: mapping.original_criteria as string[]
      }));

      setMappings(formattedMappings);
    } catch (error) {
      console.error('Failed to load mappings:', error);
      setMappings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMappings = async (newMappings: CriteriaMapping[]) => {
    if (!selectedEvent || !userProfile?.school_id) return;

    try {
      // Delete existing mappings for this event and school
      await supabase
        .from('criteria_mappings')
        .delete()
        .eq('event_type', selectedEvent)
        .eq('school_id', userProfile.school_id)
        .eq('is_global', false);

      // Insert new mappings
      const mappingsToInsert = newMappings.map(mapping => ({
        event_type: selectedEvent,
        display_name: mapping.displayName,
        original_criteria: mapping.originalCriteria,
        school_id: userProfile.school_id,
        created_by: userProfile.id,
        is_global: false
      }));

      if (mappingsToInsert.length > 0) {
        const { error } = await supabase
          .from('criteria_mappings')
          .insert(mappingsToInsert);

        if (error) throw error;
      }

      setMappings(newMappings);
    } catch (error) {
      console.error('Failed to save mappings:', error);
    }
  };

  const findSimilarMappings = async (criteriaText: string) => {
    if (!selectedEvent) return [];

    try {
      const { data, error } = await supabase.rpc('find_similar_criteria', {
        criteria_text: criteriaText,
        event_type_param: selectedEvent
      });

      if (error) throw error;
      
      // Convert the data to the expected format
      return (data || []).map((item: any) => ({
        id: item.id,
        display_name: item.display_name,
        original_criteria: Array.isArray(item.original_criteria) 
          ? item.original_criteria 
          : [],
        usage_count: item.usage_count,
        similarity_score: item.similarity_score
      }));
    } catch (error) {
      console.error('Failed to find similar mappings:', error);
      return [];
    }
  };

  // Apply mappings to criteria list
  const getMappedCriteria = (): string[] => {
    if (mappings.length === 0) {
      return originalCriteria;
    }

    const mappedCriteria = new Set<string>();
    const mappedOriginals = new Set<string>();

    // Add mapped criteria display names
    mappings.forEach(mapping => {
      mappedCriteria.add(mapping.displayName);
      mapping.originalCriteria.forEach(original => {
        mappedOriginals.add(original);
      });
    });

    // Add unmapped original criteria
    originalCriteria.forEach(criteria => {
      if (!mappedOriginals.has(criteria)) {
        mappedCriteria.add(criteria);
      }
    });

    return sortCriteriaByNumber(Array.from(mappedCriteria));
  };

  // Apply mappings to raw data processing
  const applyMappingsToData = (rawToFormattedMap: Map<string, string>): Map<string, string> => {
    if (mappings.length === 0) {
      return rawToFormattedMap;
    }

    const mappedData = new Map<string, string>();

    // Create reverse mapping from original criteria to display names
    const originalToDisplay = new Map<string, string>();
    mappings.forEach(mapping => {
      mapping.originalCriteria.forEach(original => {
        originalToDisplay.set(original, mapping.displayName);
      });
    });

    // Apply mappings
    rawToFormattedMap.forEach((formatted, raw) => {
      const displayName = originalToDisplay.get(formatted);
      if (displayName) {
        mappedData.set(raw, displayName);
      } else {
        mappedData.set(raw, formatted);
      }
    });

    return mappedData;
  };

  return {
    mappings,
    setMappings: saveMappings,
    getMappedCriteria,
    applyMappingsToData,
    findSimilarMappings,
    isLoading,
    similarMappings,
    setSimilarMappings
  };
};