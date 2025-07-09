import { useState, useEffect } from 'react';
import type { CriteriaMapping } from '../components/reports/AdvancedCriteriaMapping';

interface UseCriteriaMappingProps {
  selectedEvent: string | null;
  originalCriteria: string[];
}

export const useCriteriaMapping = ({ selectedEvent, originalCriteria }: UseCriteriaMappingProps) => {
  const [mappings, setMappings] = useState<CriteriaMapping[]>([]);

  // Load mappings from localStorage when event changes
  useEffect(() => {
    if (selectedEvent) {
      const savedMappings = localStorage.getItem(`criteria-mappings-${selectedEvent}`);
      if (savedMappings) {
        try {
          setMappings(JSON.parse(savedMappings));
        } catch (error) {
          console.error('Failed to parse saved mappings:', error);
          setMappings([]);
        }
      } else {
        setMappings([]);
      }
    }
  }, [selectedEvent]);

  // Save mappings to localStorage whenever they change
  useEffect(() => {
    if (selectedEvent && mappings.length >= 0) {
      localStorage.setItem(`criteria-mappings-${selectedEvent}`, JSON.stringify(mappings));
    }
  }, [selectedEvent, mappings]);

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

    return Array.from(mappedCriteria).sort((a, b) => {
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
    setMappings,
    getMappedCriteria,
    applyMappingsToData
  };
};