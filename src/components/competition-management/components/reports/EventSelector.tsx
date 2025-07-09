import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const handleEventToggle = (event: CompetitionEventType, checked: boolean) => {
    if (checked) {
      onEventSelect([...selectedEvents, event]);
    } else {
      onEventSelect(selectedEvents.filter(e => e !== event));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No competition events found. Add some competitions with events to see performance data.
          </p>
        ) : (
          availableEvents.map((event) => (
            <div key={event} className="flex items-center space-x-2">
              <Checkbox
                id={event}
                checked={selectedEvents.includes(event)}
                onCheckedChange={(checked) => handleEventToggle(event, checked as boolean)}
              />
              <Label 
                htmlFor={event} 
                className="text-sm font-normal cursor-pointer"
              >
                {event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};