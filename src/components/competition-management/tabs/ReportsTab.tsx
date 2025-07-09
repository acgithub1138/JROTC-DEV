import React, { useState, useEffect } from 'react';
import { EventSelector } from '../components/reports/EventSelector';
import { PerformanceChart } from '../components/reports/PerformanceChart';
import { ChartLegend } from '../components/reports/ChartLegend';
import { useCompetitionReports } from '../hooks/useCompetitionReports';

export const ReportsTab = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [visibleCriteria, setVisibleCriteria] = useState<string[]>([]);
  
  const { reportData, isLoading, isLoadingEvents, availableEvents, scoringCriteria } = useCompetitionReports(selectedEvent);

  const handleEventSelect = (event: string | null) => {
    setSelectedEvent(event);
    setVisibleCriteria([]); // Reset visible criteria when event changes
  };

  // Auto-select all criteria when scoringCriteria changes (new event selected)
  useEffect(() => {
    if (scoringCriteria.length > 0 && selectedEvent) {
      setVisibleCriteria(scoringCriteria);
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
      <div>
        <h2 className="text-2xl font-semibold mb-2">Competition Performance Reports</h2>
        <p className="text-muted-foreground">
          Analyze your competition performance trends over time by event type.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <EventSelector
            availableEvents={availableEvents}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
            isLoading={isLoadingEvents}
          />
          
          {selectedEvent && (
            <ChartLegend
              scoringCriteria={scoringCriteria}
              visibleCriteria={visibleCriteria}
              onCriteriaToggle={handleCriteriaVisibilityToggle}
              onSelectAll={handleSelectAllCriteria}
              onUnselectAll={handleUnselectAllCriteria}
            />
          )}
        </div>

        <div className="lg:col-span-3">
          <PerformanceChart
            data={reportData}
            visibleCriteria={visibleCriteria}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};