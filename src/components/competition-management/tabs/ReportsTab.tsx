import React, { useState, useEffect } from 'react';
import { EventSelector } from '../components/reports/EventSelector';
import { CompetitionSelector } from '../components/reports/CompetitionSelector';
import { PerformanceChart } from '../components/reports/PerformanceChart';
import { ChartLegend } from '../components/reports/ChartLegend';
import { useCompetitionReports } from '../hooks/useCompetitionReports';
export const ReportsTab = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[] | null>(null);
  const [visibleCriteria, setVisibleCriteria] = useState<string[]>([]);
  const {
    reportData,
    isLoading,
    isLoadingEvents,
    isLoadingCompetitions,
    availableEvents,
    availableCompetitions,
    scoringCriteria
  } = useCompetitionReports(selectedEvent, selectedCompetitions);
  const handleEventSelect = (event: string | null) => {
    setSelectedEvent(event);
    setVisibleCriteria([]); // Reset visible criteria when event changes

    // Auto-select first 6 competitions ordered by date descending when event is selected
    if (event && availableCompetitions.length > 0) {
      const sortedCompetitions = [...availableCompetitions].sort((a, b) => new Date(b.competition_date).getTime() - new Date(a.competition_date).getTime()).slice(0, 6).map(comp => comp.id);
      setSelectedCompetitions(sortedCompetitions);
    }
  };

  // Auto-select all criteria when scoringCriteria changes (new event selected)
  useEffect(() => {
    if (scoringCriteria.length > 0 && selectedEvent) {
      setVisibleCriteria(scoringCriteria);
    }
  }, [scoringCriteria, selectedEvent]);
  const handleCriteriaVisibilityToggle = (criteria: string) => {
    setVisibleCriteria(prev => prev.includes(criteria) ? prev.filter(c => c !== criteria) : [...prev, criteria]);
  };
  const handleSelectAllCriteria = () => {
    setVisibleCriteria(scoringCriteria);
  };
  const handleUnselectAllCriteria = () => {
    setVisibleCriteria([]);
  };
  return <div className="space-y-6">
      <div>
        
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EventSelector availableEvents={availableEvents} selectedEvent={selectedEvent} onEventSelect={handleEventSelect} isLoading={isLoadingEvents} />
        
        <CompetitionSelector availableCompetitions={availableCompetitions} selectedCompetitions={selectedCompetitions} onCompetitionSelect={setSelectedCompetitions} isLoading={isLoadingCompetitions} />
      </div>

      {selectedEvent && <div className="flex gap-4">
          {/* Performance Trends - 3/4 width */}
          <div className="w-3/4">
            <PerformanceChart data={reportData} visibleCriteria={visibleCriteria} isLoading={isLoading} />
          </div>
          
          {/* Scoring Criteria - 1/4 width */}
          <div className="w-1/4">
            <ChartLegend scoringCriteria={scoringCriteria} visibleCriteria={visibleCriteria} onCriteriaToggle={handleCriteriaVisibilityToggle} onSelectAll={handleSelectAllCriteria} onUnselectAll={handleUnselectAllCriteria} />
          </div>
        </div>}
    </div>;
};