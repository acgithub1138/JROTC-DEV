import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { isSameDay, format } from 'date-fns';

// Stable filters object to prevent re-renders
const STABLE_FILTERS = { eventType: '', assignedTo: '' };

export const MobileCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { canCreate } = useTablePermissions('calendar');
  const { events, isLoading: eventsLoading } = useEvents(STABLE_FILTERS);
  const { timezone, isLoading: timezoneLoading } = useSchoolTimezone();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  
  const isLoading = eventsLoading || timezoneLoading;
  
  // Group events by date for calendar indicators
  const eventsByDate = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};
    events.forEach(event => {
      const dateKey = format(new Date(event.start_date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  // Get events for selected date
  const eventsForSelectedDate = React.useMemo(() => {
    return events
      .filter(event => isSameDay(new Date(event.start_date), selectedDate))
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [events, selectedDate]);

  const getEventTypeColor = (eventType: any) => {
    if (eventType?.color) {
      return `bg-[${eventType.color}]`;
    }
    // Fallback colors based on type label
    const typeLabel = eventType?.label?.toLowerCase() || '';
    if (typeLabel.includes('drill')) return 'bg-blue-500';
    if (typeLabel.includes('meeting')) return 'bg-green-500';
    if (typeLabel.includes('competition')) return 'bg-red-500';
    if (typeLabel.includes('ceremony')) return 'bg-purple-500';
    if (typeLabel.includes('training')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const formatEventDate = (startDate: string, isAllDay: boolean) => {
    const date = new Date(startDate);
    if (isAllDay) {
      return formatTimeForDisplay(date, TIME_FORMATS.SHORT_DATE, timezone);
    }
    return formatTimeForDisplay(date, TIME_FORMATS.SHORT_DATE, timezone);
  };

  const parseLocation = (location: string) => {
    if (!location) return null;
    
    // Split by comma and trim each part
    const parts = location.split(',').map(part => part.trim());
    
    if (parts.length >= 2) {
      // First part is address, rest is city/state/zip
      const address = parts[0];
      const cityStateZip = parts.slice(1).join(', ');
      return { address, cityStateZip, full: location };
    }
    
    // If no comma, treat entire string as address
    return { address: location, cityStateZip: '', full: location };
  };

  const formatEventTime = (startDate: string, endDate: string, isAllDay: boolean) => {
    if (isAllDay) return 'All day';
    
    const start = formatTimeForDisplay(startDate, TIME_FORMATS.TIME_ONLY_24H, timezone);
    const end = formatTimeForDisplay(endDate, TIME_FORMATS.TIME_ONLY_24H, timezone);
    return `${start} - ${end}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon size={16} />
            <span>Calendar</span>
          </div>
        </div>
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon size={16} />
          <span>Calendar</span>
        </div>
        {canCreate && (
          <Button
            size="sm"
            onClick={() => navigate('/mobile/calendar/add')}
            className="h-8 w-8 p-0"
          >
            <Plus size={16} />
          </Button>
        )}
      </div>

      {/* Calendar with Event Indicators */}
      <Card className="p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="w-full"
          modifiers={{
            hasEvents: (date) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              return !!eventsByDate[dateKey];
            }
          }}
          modifiersClassNames={{
            hasEvents: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:bg-primary after:rounded-full'
          }}
        />
      </Card>

      {/* Events for Selected Date */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon size={14} />
          <span>Events for {format(selectedDate, 'MMM d, yyyy')}</span>
        </div>

        {eventsForSelectedDate.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <CalendarIcon size={32} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                No events scheduled for this date.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {eventsForSelectedDate.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-12 rounded-full ${getEventTypeColor(event.event_types)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {event.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{formatEventTime(event.start_date, event.end_date, event.is_all_day)}</span>
                        </div>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors"
                          >
                            {(() => {
                              const parsed = parseLocation(event.location);
                              if (!parsed) return event.location;
                              return (
                                <div>
                                  <div>{parsed.address}</div>
                                  {parsed.cityStateZip && (
                                    <div>{parsed.cityStateZip}</div>
                                  )}
                                </div>
                              );
                            })()}
                          </a>
                        </div>
                      )}
                      
                      {event.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      {event.event_types && (
                        <div className="mt-3">
                          <Badge variant="secondary" className="capitalize">
                            {event.event_types.label}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};