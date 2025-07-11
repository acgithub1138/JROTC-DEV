import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import { useTablePermissions } from '@/hooks/useTablePermissions';

interface EventsListProps {
  events: any[];
  isLoading: boolean;
  onDeleteEvent: (eventId: string) => void;
  onViewEvent?: (event: any) => void;
}

export const EventsList: React.FC<EventsListProps> = ({
  events,
  isLoading,
  onDeleteEvent,
  onViewEvent
}) => {
  const { canViewDetails, canDelete } = useTablePermissions('competitions');
  if (isLoading) {
    return <div className="p-4">Loading events...</div>;
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No events recorded yet. Use the "Add Event" button to add your first event result.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{event.event}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {event.profiles?.first_name} {event.profiles?.last_name}
                  </span>
                  <Badge variant="secondary">
                    {event.total_points || 0} points
                  </Badge>
                </div>
              </div>
               <div className="flex gap-2">
                 {onViewEvent && canViewDetails && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => onViewEvent(event)}
                   >
                     <Eye className="w-4 h-4" />
                   </Button>
                 )}
                 {canDelete && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => onDeleteEvent(event.id)}
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 )}
               </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-muted-foreground">
              <p>
                Recorded: {new Date(event.created_at).toLocaleDateString()}
              </p>
              {event.score_sheet?.template_name && (
                <p>Template: {event.score_sheet.template_name}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};