import React, { useState } from 'react';
import { EventSelector } from '../components/reports/EventSelector';
import { PerformanceChart } from '../components/reports/PerformanceChart';
import { ChartLegend } from '../components/reports/ChartLegend';
import { useCompetitionReports } from '../hooks/useCompetitionReports';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = Database['public']['Enums']['comp_event_type'];

export const ReportsTab = () => {
  const [selectedEvent, setSelectedEvent] = useState<CompetitionEventType | null>(null);
  const [visibleCriteria, setVisibleCriteria] = useState<string[]>([]);
  
  const { reportData, isLoading, isLoadingEvents, availableEvents, scoringCriteria } = useCompetitionReports(selectedEvent);

  const handleEventSelect = (event: CompetitionEventType | null) => {
    setSelectedEvent(event);
    setVisibleCriteria([]); // Reset visible criteria when event changes
  };

  const handleCriteriaVisibilityToggle = (criteria: string) => {
    setVisibleCriteria(prev => 
      prev.includes(criteria) 
        ? prev.filter(c => c !== criteria)
        : [...prev, criteria]
    );
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