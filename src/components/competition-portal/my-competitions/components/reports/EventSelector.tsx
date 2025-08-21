import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventSelectorProps {
  events?: string[];
  availableEvents?: string[];
  selectedEvent: string;
  onEventChange?: (event: string) => void;
  onEventSelect?: (event: string) => void;
  isLoading?: boolean;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  events,
  availableEvents,
  selectedEvent,
  onEventChange,
  onEventSelect,
  isLoading = false
}) => {
  const eventList = (events || availableEvents || []).sort((a, b) => a.localeCompare(b));
  const handleChange = onEventChange || onEventSelect || (() => {});
  
  return (
    <div className="flex gap-4 items-center">
      <label className="text-sm font-medium">Select Event:</label>
      <Select value={selectedEvent} onValueChange={handleChange} disabled={isLoading}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Choose an event type..." />
        </SelectTrigger>
        <SelectContent>
          {eventList.map((event) => (
            <SelectItem key={event} value={event}>
              {event}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};