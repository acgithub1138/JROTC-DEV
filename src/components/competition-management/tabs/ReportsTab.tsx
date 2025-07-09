import React, { useState } from 'react';
import { EventSelector } from '../components/reports/EventSelector';
import { PerformanceChart } from '../components/reports/PerformanceChart';
import { ChartLegend } from '../components/reports/ChartLegend';
import { useCompetitionReports } from '../hooks/useCompetitionReports';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = Database['public']['Enums']['comp_event_type'];

export const ReportsTab = () => {
  const [selectedEvents, setSelectedEvents] = useState<CompetitionEventType[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<CompetitionEventType[]>([]);
  
  const { reportData, isLoading, isLoadingEvents, availableEvents } = useCompetitionReports(selectedEvents);

  const handleEventSelect = (events: CompetitionEventType[]) => {
    setSelectedEvents(events);
    setVisibleEvents(events); // By default, show all selected events
  };

  const handleEventVisibilityToggle = (event: CompetitionEventType) => {
    setVisibleEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
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
            selectedEvents={selectedEvents}
            onEventSelect={handleEventSelect}
            isLoading={isLoadingEvents}
          />
          
          {selectedEvents.length > 0 && (
            <ChartLegend
              selectedEvents={selectedEvents}
              visibleEvents={visibleEvents}
              onEventToggle={handleEventVisibilityToggle}
            />
          )}
        </div>

        <div className="lg:col-span-3">
          <PerformanceChart
            data={reportData}
            visibleEvents={visibleEvents}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};