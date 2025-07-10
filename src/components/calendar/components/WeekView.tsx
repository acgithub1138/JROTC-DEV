import React from 'react';
import { format, startOfWeek, addDays, isSameDay, addHours, startOfDay } from 'date-fns';
import { Event } from '../CalendarManagementPage';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'training': return 'bg-blue-500 border-blue-600';
    case 'competition': return 'bg-red-500 border-red-600';
    case 'ceremony': return 'bg-purple-500 border-purple-600';
    case 'meeting': return 'bg-green-500 border-green-600';
    case 'drill': return 'bg-orange-500 border-orange-600';
    default: return 'bg-gray-500 border-gray-600';
  }
};

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.start_date), date));
  };

  const getAllDayEvents = (date: Date) => {
    return getEventsForDay(date).filter(event => event.is_all_day);
  };

  const getTimedEvents = (date: Date) => {
    return getEventsForDay(date).filter(event => !event.is_all_day);
  };

  const getEventPosition = (event: Event) => {
    const startTime = new Date(event.start_date);
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endTime = event.end_date ? new Date(event.end_date) : addHours(startTime, 1);
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    const top = ((startHour - 6) / 16) * 100;
    const height = ((endHour - startHour) / 16) * 100;
    
    return { top: `${Math.max(0, top)}%`, height: `${Math.max(4, height)}%` };
  };

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b bg-muted/30">
        <div className="p-3 border-r"></div>
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-3 text-center border-r last:border-r-0">
            <div className="font-semibold">{format(day, 'EEE')}</div>
            <div className={cn(
              "text-2xl mt-1",
              isSameDay(day, new Date()) && "text-primary font-bold"
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events section */}
      <div className="grid grid-cols-8 border-b min-h-16">
        <div className="p-3 border-r bg-muted/30 text-sm font-medium">All day</div>
        {weekDays.map(day => {
          const allDayEvents = getAllDayEvents(day);
          return (
            <div key={`allday-${day.toISOString()}`} className="p-2 border-r last:border-r-0 space-y-1">
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs px-2 py-1 rounded text-white truncate",
                    getEventTypeColor(event.event_type).split(' ')[0],
                    onEventClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
                  )}
                  onClick={onEventClick ? () => onEventClick(event) : undefined}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time slots */}
      <div className="relative">
        <div className="grid grid-cols-8">
          {/* Time labels */}
          <div className="border-r bg-muted/30">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b px-3 py-2 text-sm text-muted-foreground">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => (
            <div key={day.toISOString()} className="relative border-r last:border-r-0">
              {/* Time slots */}
              {hours.map(hour => (
                <div
                  key={hour}
                  className="h-16 border-b cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onTimeSlotClick(day, hour)}
                />
              ))}
              
              {/* Timed events */}
              {getTimedEvents(day).map(event => {
                const position = getEventPosition(event);
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute left-1 right-1 rounded border-l-4 p-1 text-white transition-opacity z-10",
                      getEventTypeColor(event.event_type),
                      onEventClick ? "cursor-pointer hover:opacity-90" : "cursor-default"
                    )}
                    style={position}
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                    title={`${event.title} - ${format(new Date(event.start_date), 'HH:mm')}`}
                  >
                    <div className="text-xs font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-90">
                      {format(new Date(event.start_date), 'HH:mm')}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};