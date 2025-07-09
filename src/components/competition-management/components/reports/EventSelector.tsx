import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = Database['public']['Enums']['comp_event_type'];

interface EventSelectorProps {
  availableEvents: CompetitionEventType[];
  selectedEvent: CompetitionEventType | null;
  onEventSelect: (event: CompetitionEventType | null) => void;
  isLoading: boolean;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  availableEvents,
  selectedEvent,
  onEventSelect,
  isLoading
}) => {
  const handleEventSelect = (eventValue: string) => {
    const event = eventValue as CompetitionEventType;
    onEventSelect(event);
  };

  const handleEventClear = () => {
    onEventSelect(null);
  };

  const formatEventName = (event: CompetitionEventType) => {
    return event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No competition events found. Add some competitions with events to see performance data.
          </p>
        ) : (
          <>
            <Select value={selectedEvent || ''} onValueChange={handleEventSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map((event) => (
                  <SelectItem key={event} value={event}>
                    {formatEventName(event)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEvent && (
              <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                <span className="text-sm font-medium">Selected: {formatEventName(selectedEvent)}</span>
                <button
                  onClick={handleEventClear}
                  className="text-muted-foreground hover:text-destructive text-lg"
                >
                  ×
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};