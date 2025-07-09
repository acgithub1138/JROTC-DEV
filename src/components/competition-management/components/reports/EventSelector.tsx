import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = Database['public']['Enums']['comp_event_type'];

interface EventSelectorProps {
  availableEvents: CompetitionEventType[];
  selectedEvents: CompetitionEventType[];
  onEventSelect: (events: CompetitionEventType[]) => void;
  isLoading: boolean;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  availableEvents,
  selectedEvents,
  onEventSelect,
  isLoading
}) => {
  const handleEventSelect = (eventValue: string) => {
    const event = eventValue as CompetitionEventType;
    if (!selectedEvents.includes(event)) {
      onEventSelect([...selectedEvents, event]);
    }
  };

  const handleEventRemove = (eventToRemove: CompetitionEventType) => {
    onEventSelect(selectedEvents.filter(e => e !== eventToRemove));
  };

  const formatEventName = (event: CompetitionEventType) => {
    return event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const availableToAdd = availableEvents.filter(event => !selectedEvents.includes(event));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Events</CardTitle>
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
        <CardTitle>Select Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No competition events found. Add some competitions with events to see performance data.
          </p>
        ) : (
          <>
            <Select onValueChange={handleEventSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Add an event to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((event) => (
                  <SelectItem key={event} value={event}>
                    {formatEventName(event)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEvents.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Events:</Label>
                <div className="space-y-1">
                  {selectedEvents.map((event) => (
                    <div key={event} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <span className="text-sm">{formatEventName(event)}</span>
                      <button
                        onClick={() => handleEventRemove(event)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};