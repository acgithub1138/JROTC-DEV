import React from 'react';
import { Event } from '../CalendarManagementPage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit2 } from 'lucide-react';

interface ListViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  readOnly?: boolean;
}

export const ListView: React.FC<ListViewProps> = ({
  events,
  onEventClick,
  readOnly = false,
}) => {
  // Sort events by start date and take the next 25
  const sortedEvents = events
    .filter(event => new Date(event.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 25);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'class': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      case 'holiday': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: string) => {
    const eventDate = new Date(date);
    return format(eventDate, 'MMM d, yyyy');
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No upcoming events found.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Upcoming Events ({sortedEvents.length})</h3>
        <p className="text-sm text-muted-foreground">Next 25 events in chronological order</p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEvents.map((event) => (
            <TableRow key={event.id} className="hover:bg-muted/50">
              <TableCell>
                <div>
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getEventTypeColor(event.event_type)}>
                  {event.event_type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDateTime(event.start_date)}
                  {event.end_date && event.end_date !== event.start_date && (
                    <div className="text-muted-foreground">
                      to {formatDateTime(event.end_date)}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {event.location || '—'}
                </div>
              </TableCell>
              <TableCell className="text-center">
                {onEventClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEventClick(event)}
                    className="h-8 w-8 p-0"
                  >
                    {readOnly ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <Edit2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};