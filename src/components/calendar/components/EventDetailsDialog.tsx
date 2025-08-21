
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, FileText } from 'lucide-react';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { Event } from '../CalendarManagementPage';

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

export const EventDetailsDialog = ({
  open,
  onOpenChange,
  event,
}: EventDetailsDialogProps) => {
  const { timezone } = useSchoolTimezone();
  
  if (!event) return null;

  const formatEventType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateTime = (dateStr: string, isAllDay: boolean) => {
    if (isAllDay) {
      return formatTimeForDisplay(dateStr, TIME_FORMATS.FULL_DATE, timezone);
    }
    return formatTimeForDisplay(dateStr, TIME_FORMATS.FULL_DATETIME_24H, timezone);
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
              {event.event_types?.label || formatEventType(event.event_type)}
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
          
          {/* Assignments */}
          {event.event_assignments && event.event_assignments.length > 0 && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Assignments</p>
                <div className="space-y-2 mt-1">
                  {event.event_assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-2">
                      <Badge 
                        variant={assignment.assignee_type === 'team' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {assignment.assignee_type === 'team' ? 'Team' : 'Cadet'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {assignment.assignee_name}
                      </span>
                      {assignment.role && (
                        <span className="text-xs text-muted-foreground">
                          ({assignment.role})
                        </span>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          assignment.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                          assignment.status === 'declined' ? 'bg-red-50 text-red-700 border-red-200' :
                          assignment.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Created: {formatTimeForDisplay(event.created_at, TIME_FORMATS.SHORT_DATETIME_24H, timezone)}</span>
            </div>
            {event.updated_at !== event.created_at && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Updated: {formatTimeForDisplay(event.updated_at, TIME_FORMATS.SHORT_DATETIME_24H, timezone)}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};