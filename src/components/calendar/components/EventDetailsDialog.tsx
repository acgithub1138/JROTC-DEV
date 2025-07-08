import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '../CalendarManagementPage';

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  open,
  onOpenChange,
  event,
}) => {
  if (!event) return null;

  const formatEventType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateTime = (dateStr: string, isAllDay: boolean) => {
    const date = new Date(dateStr);
    if (isAllDay) {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
    return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {formatEventType(event.event_type)}
            </Badge>
            {event.is_all_day && (
              <Badge variant="outline">All Day</Badge>
            )}
          </div>

          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Date & Time</p>
              <p className="text-muted-foreground">
                {formatDateTime(event.start_date, event.is_all_day)}
              </p>
              {event.end_date && event.end_date !== event.start_date && (
                <p className="text-muted-foreground text-sm">
                  Ends: {formatDateTime(event.end_date, event.is_all_day)}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{event.location}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Description</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Created: {format(new Date(event.created_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
            </div>
            {event.updated_at !== event.created_at && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Updated: {format(new Date(event.updated_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};