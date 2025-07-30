import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, isSameDay, startOfDay, addDays } from 'date-fns';
import { Event } from '../CalendarManagementPage';
import { MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { getSchoolDateKey, formatInSchoolTimezone, isSameDayInSchoolTimezone, isDatePastInSchoolTimezone } from '@/utils/timezoneUtils';

interface AgendaViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
}

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'training': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'competition': return 'bg-red-100 text-red-800 border-red-200';
    case 'ceremony': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'meeting': return 'bg-green-100 text-green-800 border-green-200';
    case 'drill': return 'bg-orange-100 text-orange-800 border-orange-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const AgendaView: React.FC<AgendaViewProps> = ({
  currentDate,
  events,
  onEventClick,
}) => {
  const { timezone, isLoading } = useSchoolTimezone();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get events for the current month and sort by date/time
  const monthEvents = events
    .filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  // Group events by date using school timezone
  const groupedEvents = monthEvents.reduce((acc, event) => {
    const dateKey = getSchoolDateKey(event.start_date, timezone);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const today = new Date();

  return (
    <div className="space-y-4">
      {Object.keys(groupedEvents).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="text-lg mb-2">No events this month</div>
            <div className="text-sm">Create your first event to get started</div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
          const isToday = isSameDayInSchoolTimezone(dateKey, today, timezone);
          const isPast = isDatePastInSchoolTimezone(dateKey, timezone);
          
          return (
            <div key={dateKey} className="space-y-2">
              {/* Date Header */}
              <div className={cn(
                "sticky top-0 bg-background/95 backdrop-blur-sm border-b pb-2 z-10",
                isToday && "border-primary"
              )}>
                <h3 className={cn(
                  "text-lg font-semibold",
                  isToday && "text-primary",
                  isPast && !isToday && "text-muted-foreground"
                )}>
                  {formatInSchoolTimezone(dateKey, 'EEEE, MMMM d, yyyy', timezone)}
                  {isToday && (
                    <Badge variant="outline" className="ml-2 text-primary border-primary">
                      Today
                    </Badge>
                  )}
                </h3>
              </div>

              {/* Events for this date */}
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <Card
                    key={event.id}
                    className={cn(
                      "transition-all border-l-4",
                      getEventTypeColor(event.event_type),
                      isPast && !isToday && "opacity-60",
                      onEventClick ? "cursor-pointer hover:shadow-md" : "cursor-default"
                    )}
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg truncate">{event.title}</h4>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs",
                                getEventTypeColor(event.event_type)
                              )}
                            >
                              {event.event_type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                               {event.is_all_day ? (
                                 'All day'
                               ) : (
                                 <>
                                    {formatInSchoolTimezone(event.start_date, 'HH:mm', timezone)}
                                    {event.end_date && (
                                      <span> - {formatInSchoolTimezone(event.end_date, 'HH:mm', timezone)}</span>
                                    )}
                                 </>
                               )}
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};