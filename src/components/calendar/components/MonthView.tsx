
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Event } from '../CalendarManagementPage';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { isSameDayInSchoolTimezone, formatInSchoolTimezone } from '@/utils/timezoneUtils';

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDateClick: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
}

const getEventTypeColor = (event: Event) => {
  const color = event.event_types?.color || '#6b7280'; // Default to gray
  return {
    backgroundColor: color,
    borderColor: color
  };
};

export const MonthView = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onDateDoubleClick,
}: MonthViewProps) => {
  const { timezone, isLoading } = useSchoolTimezone();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (date: Date) => {
    if (isLoading) return [];
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;
      
      // For multi-day events, check if the date falls within the event's date range
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      
      const eventStartDate = new Date(eventStart);
      eventStartDate.setHours(0, 0, 0, 0);
      
      const eventEndDate = new Date(eventEnd);
      eventEndDate.setHours(0, 0, 0, 0);
      
      return dateStart >= eventStartDate && dateStart <= eventEndDate;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center font-semibold text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7" style={{ minHeight: '600px' }}>
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-b last:border-r-0 p-2 min-h-24 cursor-pointer hover:bg-accent/50 transition-colors",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isCurrentDay && "bg-primary/10"
              )}
              onClick={() => onDateClick(day)}
              onDoubleClick={() => onDateDoubleClick?.(day)}
            >
              <div className={cn(
                "text-sm font-medium mb-1",
                isCurrentDay && "text-primary font-bold"
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                   <div
                     key={event.id}
                     className={cn(
                       "text-xs px-2 py-1 rounded text-white truncate flex items-center gap-1",
                       onEventClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
                     )}
                     style={getEventTypeColor(event)}
                     onClick={onEventClick ? (e) => {
                       e.stopPropagation();
                       onEventClick(event);
                     } : undefined}
                     title={event.title}
                   >
                     {event.is_recurring && (
                       <RotateCcw className="w-3 h-3 flex-shrink-0" />
                     )}
                      <span className="truncate">
                        {event.is_all_day ? event.title : `${formatInSchoolTimezone(event.start_date, 'HH:mm', timezone)} ${event.title}`}
                      </span>
                   </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};