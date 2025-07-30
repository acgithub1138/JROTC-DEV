import React from 'react';
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

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'training': return 'bg-blue-500';
    case 'competition': return 'bg-red-500';
    case 'ceremony': return 'bg-purple-500';
    case 'meeting': return 'bg-green-500';
    case 'drill': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onDateDoubleClick,
}) => {
  const { timezone, isLoading } = useSchoolTimezone();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (date: Date) => {
    if (isLoading) return [];
    return events.filter(event => isSameDayInSchoolTimezone(event.start_date, date, timezone));
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
                       getEventTypeColor(event.event_type),
                       onEventClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
                     )}
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