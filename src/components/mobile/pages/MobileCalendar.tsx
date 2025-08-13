import React from 'react';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';

export const MobileCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { canCreate } = useTablePermissions('calendar');
  const { events, isLoading } = useEvents({ eventType: '', assignedTo: '' });
  const { timezone } = useSchoolTimezone();
  
  // Filter to upcoming events (future or today) and sort by start date
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 10); // Limit to next 10 events

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
            <Calendar size={16} />
            <span>Upcoming Events</span>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={16} />
          <span>Upcoming Events</span>
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

      {upcomingEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Events Scheduled</h3>
            <p className="text-sm text-muted-foreground text-center">
              Check back later for upcoming events and activities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
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
                        <Calendar size={14} />
                        <span>{formatEventDate(event.start_date, event.is_all_day)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatEventTime(event.start_date, event.end_date, event.is_all_day)}</span>
                      </div>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin size={14} />
                        <span>{event.location}</span>
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
  );
};