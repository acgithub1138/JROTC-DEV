
import { Event } from '../CalendarManagementPage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit2, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ListViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  readOnly?: boolean;
}

export const ListView = ({
  events,
  onEventClick,
  readOnly = false,
}: ListViewProps) => {
  // Sort events by start date and take the next 25
  const sortedEvents = events
    .filter(event => new Date(event.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 25);

  const getEventTypeColor = (event: Event) => {
    const color = event.event_types?.color || '#6b7280'; // Default to gray
    // Convert hex to RGB and create light background
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
      color: color,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.2)`
    };
  };

  const formatDateTime = (date: string) => {
    const eventDate = new Date(date);
    return format(eventDate, 'MMM d, yyyy');
  };

  const formatAddress = (address: string) => {
    // Split by common address delimiters
    const parts = address
      .split(/[,;]/)
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    if (parts.length === 0) return [address];
    
    // Try to identify venue name vs street address
    // Venue name is typically the first part that doesn't start with a number
    // Street address typically starts with a number
    const venueIndex = parts.findIndex(part => !/^\d/.test(part));
    const addressIndex = parts.findIndex(part => /^\d/.test(part));
    
    if (venueIndex !== -1 && addressIndex !== -1 && venueIndex < addressIndex) {
      // We have a venue name followed by a street address
      const venueName = parts.slice(0, addressIndex).join(', ');
      const streetAddress = parts.slice(addressIndex).join(', ');
      return [venueName, streetAddress];
    }
    
    // Fallback: if no clear pattern, split roughly in half
    if (parts.length > 2) {
      const midpoint = Math.ceil(parts.length / 2);
      return [
        parts.slice(0, midpoint).join(', '),
        parts.slice(midpoint).join(', ')
      ];
    }
    
    // If only 1-2 parts, return as is
    return parts;
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No upcoming events found.
      </div>
    );
  }

  return (
    <TooltipProvider>
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
              <TableHead className="text-center">Location</TableHead>
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
                  <Badge 
                    className="border"
                    style={getEventTypeColor(event)}
                  >
                    {event.event_types?.label || 'Unknown'}
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
                <TableCell className="text-center">
                  {event.location ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          {formatAddress(event.location).map((line, index) => (
                            <div key={index} className="text-sm">
                              {line}
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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
    </TooltipProvider>
  );
};