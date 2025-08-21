import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CompetitionEvent } from './types';

interface EventSelectorProps {
  events: CompetitionEvent[];
  selectedEvent: string;
  onEventChange: (event: string) => void;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  events,
  selectedEvent,
  onEventChange
}) => {
  const uniqueEventTypes = [...new Set(events.map(event => event.event))].sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex gap-4 items-center">
      <label className="text-sm font-medium">Select Event:</label>
      <Select value={selectedEvent} onValueChange={onEventChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Choose an event type..." />
        </SelectTrigger>
        <SelectContent>
          {uniqueEventTypes.map((eventType) => (
            <SelectItem key={eventType} value={eventType}>
              {eventType} ({events.filter(e => e.event === eventType).length} score sheets)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};