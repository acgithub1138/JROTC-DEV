import React, { useState, useEffect } from 'react';
import { EventSelector } from '../components/reports/EventSelector';
import { CompetitionSelector } from '../components/reports/CompetitionSelector';
import { PerformanceChart } from '../components/reports/PerformanceChart';
import { ChartLegend } from '../components/reports/ChartLegend';
import { AdvancedCriteriaMapping, type CriteriaMapping } from '../components/reports/AdvancedCriteriaMapping';
import { useCompetitionReports } from '../hooks/useCompetitionReports';
import { useCriteriaMapping, sortCriteriaByNumber } from '../hooks/useCriteriaMapping';

export const ReportsTab = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[] | null>(null);
  const [visibleCriteria, setVisibleCriteria] = useState<string[]>([]);
  const [criteriaColors, setCriteriaColors] = useState<Record<string, string>>({});

  // Get original criteria before mapping for the advanced widget
  const [originalCriteria, setOriginalCriteria] = useState<string[]>([]);

  // Use the criteria mapping hook for database persistence
  const { 
    mappings, 
    setMappings, 
    getMappedCriteria, 
    applyMappingsToData, 
    findSimilarMappings,
    isLoading: isMappingsLoading
  } = useCriteriaMapping({
    selectedEvent,
    originalCriteria
  });

  const {
    reportData,
    isLoading,
    isLoadingEvents,
    isLoadingCompetitions,
    availableEvents,
    availableCompetitions,
    scoringCriteria
  } = useCompetitionReports(selectedEvent, selectedCompetitions, mappings);

  const handleEventSelect = (event: string | null) => {
    setSelectedEvent(event);
    setVisibleCriteria([]); // Reset visible criteria when event changes

    // Auto-select first 6 competitions ordered by date descending when event is selected
    if (event && availableCompetitions.length > 0) {
      const sortedCompetitions = [...availableCompetitions]
        .sort((a, b) => new Date(b.competition_date).getTime() - new Date(a.competition_date).getTime())
        .slice(0, 6)
        .map(comp => comp.id);
      setSelectedCompetitions(sortedCompetitions);
    }
  };
  
  // Store original criteria when they are first loaded
  useEffect(() => {
    if (scoringCriteria.length > 0) {
      setOriginalCriteria(scoringCriteria);
    }
  }, [scoringCriteria]);

  // Generate random colors and auto-select all criteria when scoringCriteria changes
  useEffect(() => {
    if (scoringCriteria.length > 0 && selectedEvent) {
      setVisibleCriteria(scoringCriteria);
      
      // Generate random colors for each criteria
      const newColors: Record<string, string> = {};
      scoringCriteria.forEach(criteria => {
        // Generate random HSL color with good saturation and lightness for visibility
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * 40) + 60; // 60-100%
        const lightness = Math.floor(Math.random() * 30) + 40; // 40-70%
        newColors[criteria] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      });
      setCriteriaColors(newColors);
    }
  }, [scoringCriteria, selectedEvent]);

  const handleCriteriaVisibilityToggle = (criteria: string) => {
    setVisibleCriteria(prev => 
      prev.includes(criteria) 
        ? prev.filter(c => c !== criteria) 
        : [...prev, criteria]
    );
  };

  const handleSelectAllCriteria = () => {
    setVisibleCriteria(scoringCriteria);
  };

  const handleUnselectAllCriteria = () => {
    setVisibleCriteria([]);
  };

  return (
    <div className="space-y-6">
      <EventSelector 
        availableEvents={availableEvents} 
        selectedEvent={selectedEvent} 
        onEventSelect={handleEventSelect} 
        isLoading={isLoadingEvents} 
      />

      {selectedEvent && (
        <div className="space-y-6">
          <CompetitionSelector 
            availableCompetitions={availableCompetitions} 
            selectedCompetitions={selectedCompetitions || []} 
            onCompetitionSelect={setSelectedCompetitions} 
            onSelectAll={() => setSelectedCompetitions(availableCompetitions.map(c => c.id))}
            onUnselectAll={() => setSelectedCompetitions([])}
            isLoading={isLoadingCompetitions} 
          />
          <div className="flex gap-4 items-start">
            {/* Performance Trends - 3/4 width */}
            <div className="w-3/4">
              <PerformanceChart 
                data={reportData} 
                visibleCriteria={visibleCriteria} 
                criteriaColors={criteriaColors}
                isLoading={isLoading} 
              />
            </div>
            
            {/* Scoring Criteria - 1/4 width */}
            <div className="w-1/4">
              <ChartLegend 
                scoringCriteria={scoringCriteria} 
                visibleCriteria={visibleCriteria} 
                criteriaColors={criteriaColors}
                onCriteriaToggle={handleCriteriaVisibilityToggle} 
                onSelectAll={handleSelectAllCriteria} 
                onUnselectAll={handleUnselectAllCriteria} 
              />
            </div>
          </div>

          {/* Advanced Criteria Mapping - Full width below the chart */}
          <AdvancedCriteriaMapping
            availableCriteria={sortCriteriaByNumber([...originalCriteria])}
            mappings={mappings}
            onMappingsChange={setMappings}
            selectedEvent={selectedEvent}
            isLoading={isMappingsLoading}
          />
        </div>
      )}
    </div>
  );
};