import React from 'react';
import { format, isSameDay, addHours } from 'date-fns';
import { Event } from '../CalendarManagementPage';
import { cn } from '@/lib/utils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { isSameDayInSchoolTimezone } from '@/utils/timezoneUtils';

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
}

const getEventTypeColor = (event: Event) => {
  const color = event.event_types?.color || '#6b7280'; // Default to gray
  return {
    backgroundColor: color,
    borderColor: color,
    borderLeftColor: color
  };
};

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}) => {
  const { timezone, isLoading } = useSchoolTimezone();
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM
  const currentTime = new Date();
  const isToday = isSameDayInSchoolTimezone(currentDate, currentTime, timezone);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getEventsForDay = () => {
    return events.filter(event => isSameDayInSchoolTimezone(event.start_date, currentDate, timezone));
  };

  const getAllDayEvents = () => {
    return getEventsForDay().filter(event => event.is_all_day);
  };

  const getTimedEvents = () => {
    return getEventsForDay().filter(event => !event.is_all_day);
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

  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    
    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
    if (currentHour < 6 || currentHour > 22) return null;
    
    const top = ((currentHour - 6) / 16) * 100;
    return { top: `${top}%` };
  };

  const currentTimePosition = getCurrentTimePosition();

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
      </div>

      {/* All-day events section */}
      {getAllDayEvents().length > 0 && (
        <div className="border-b bg-muted/10">
          <div className="p-3 border-b bg-muted/30 text-sm font-medium">All day</div>
          <div className="p-3 space-y-2">
            {getAllDayEvents().map(event => (
              <div
                key={event.id}
                className={cn(
                  "px-3 py-2 rounded text-white",
                  onEventClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
                )}
                style={getEventTypeColor(event)}
                onClick={onEventClick ? () => onEventClick(event) : undefined}
                title={event.title}
              >
                <div className="font-medium">{event.title}</div>
                {event.location && (
                  <div className="text-sm opacity-90">{event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time slots */}
      <div className="relative">
        <div className="grid grid-cols-12">
          {/* Time labels */}
          <div className="col-span-2 border-r bg-muted/30">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b px-3 py-2 text-sm text-muted-foreground">
                {format(new Date().setHours(hour, 0), 'HH:mm')}
              </div>
            ))}
          </div>

          {/* Event area */}
          <div className="col-span-10 relative">
            {/* Time slots */}
            {hours.map(hour => (
              <div
                key={hour}
                className="h-16 border-b cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onTimeSlotClick(currentDate, hour)}
              />
            ))}
            
            {/* Current time indicator */}
            {currentTimePosition && (
              <div
                className="absolute left-0 right-0 border-t-2 border-primary z-20"
                style={currentTimePosition}
              >
                <div className="w-3 h-3 bg-primary rounded-full -mt-1.5 -ml-1.5 absolute"></div>
              </div>
            )}
            
            {/* Timed events */}
            {getTimedEvents().map(event => {
              const position = getEventPosition(event);
              return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute left-2 right-2 rounded border-l-4 p-3 text-white transition-opacity z-10",
                      onEventClick ? "cursor-pointer hover:opacity-90" : "cursor-default"
                    )}
                    style={{
                      ...position,
                      ...getEventTypeColor(event)
                    }}
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                    title={event.title}
                  >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-sm opacity-90">
                     {format(new Date(event.start_date), 'HH:mm')}
                     {event.end_date && ` - ${format(new Date(event.end_date), 'HH:mm')}`}
                  </div>
                  {event.location && (
                    <div className="text-sm opacity-80 truncate">{event.location}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};