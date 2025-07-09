import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Database } from '@/integrations/supabase/types';

type CompetitionEventType = Database['public']['Enums']['comp_event_type'];

interface ChartLegendProps {
  selectedEvents: CompetitionEventType[];
  visibleEvents: CompetitionEventType[];
  onEventToggle: (event: CompetitionEventType) => void;
}

const EVENT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0',
  '#8dd1e1', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
];

export const ChartLegend: React.FC<ChartLegendProps> = ({
  selectedEvents,
  visibleEvents,
  onEventToggle
}) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Chart Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedEvents.map((event, index) => (
          <div key={event} className="flex items-center space-x-2">
            <Checkbox
              id={`legend-${event}`}
              checked={visibleEvents.includes(event)}
              onCheckedChange={() => onEventToggle(event)}
            />
            <div 
              className="w-4 h-2 rounded"
              style={{ backgroundColor: EVENT_COLORS[index % EVENT_COLORS.length] }}
            />
            <Label 
              htmlFor={`legend-${event}`} 
              className="text-xs font-normal cursor-pointer"
            >
              {event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};