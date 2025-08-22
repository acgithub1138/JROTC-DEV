import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Event } from '../CalendarManagementPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, startOfDay, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface MobileCalendarViewProps {
  events: Event[];
  onEventEdit?: (event: Event) => void;
  onEventView?: (event: Event) => void;
  onCreateEvent?: () => void;
  onDateSelect: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
  readOnly?: boolean;
}

export const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({
  events,
  onEventEdit,
  onEventView,
  onCreateEvent,
  onDateSelect,
  onDateDoubleClick,
  readOnly = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect(date);
    }
  };

  const handleDateDoubleClick = (date: Date) => {
    if (!readOnly && onDateDoubleClick) {
      onDateDoubleClick(date);
    }
  };

  const handlePrevDay = () => {
    const prevDay = subDays(selectedDate, 1);
    setSelectedDate(prevDay);
    onDateSelect(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    setSelectedDate(nextDay);
    onDateSelect(nextDay);
  };

  const handleEventClick = (event: Event) => {
    if (onEventEdit) {
      onEventEdit(event);
    } else if (onEventView) {
      onEventView(event);
    }
  };

  // Get events for selected date
  const selectedDateEvents = events.filter(event => 
    isSameDay(new Date(event.start_date), selectedDate)
  );

  // Get events for calendar display (show dots for days with events)
  const eventDates = events.map(event => startOfDay(new Date(event.start_date)));

  const modifiers = {
    hasEvents: eventDates,
  };

  const modifiersStyles = {
    hasEvents: {
      position: 'relative' as const,
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* iOS-style Calendar */}
      <Card className="mx-4 mt-4 shadow-sm border-border/50">
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full"
            classNames={{
              months: "w-full",
              month: "w-full space-y-2",
              caption: "flex justify-center pt-1 relative items-center mb-2",
              caption_label: "text-base font-semibold text-foreground",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-8 w-8 bg-transparent p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground w-full font-medium text-xs text-center pb-2",
              row: "flex w-full",
              cell: cn(
                "relative w-full h-10 text-center text-sm p-0",
                "focus-within:relative focus-within:z-20"
              ),
              day: cn(
                "h-9 w-full p-0 font-normal rounded-lg transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground"
              ),
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-semibold",
              day_outside: "text-muted-foreground/50",
              day_disabled: "text-muted-foreground/30",
            }}
            components={{
              Day: ({ date, ...props }) => {
                const hasEvents = eventDates.some(eventDate => 
                  isSameDay(eventDate, date)
                );
                
                return (
                  <div className="relative w-full h-9">
                    <button
                      {...props}
                      onClick={() => handleDateSelect(date)}
                      onDoubleClick={() => handleDateDoubleClick(date)}
                      className={cn(
                        "w-full h-9 p-0 font-normal rounded-lg transition-colors text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        isSameDay(date, selectedDate) && "bg-primary text-primary-foreground hover:bg-primary",
                        isSameDay(date, new Date()) && !isSameDay(date, selectedDate) && "bg-accent text-accent-foreground font-semibold",
                        format(date, 'M') !== format(selectedDate, 'M') && "text-muted-foreground/50"
                      )}
                    >
                      {format(date, 'd')}
                    </button>
                    {hasEvents && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Daily Events Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border/50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevDay}
            className="h-8 w-8 p-0 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="font-semibold text-foreground">
              {format(selectedDate, 'EEEE')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextDay}
            className="h-8 w-8 p-0 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {!readOnly && onCreateEvent && (
          <Button
            onClick={onCreateEvent}
            size="sm"
            className="rounded-full h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Daily Events List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {selectedDateEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">No events for this day</p>
            {!readOnly && onCreateEvent && (
              <Button
                variant="outline"
                onClick={onCreateEvent}
                className="mt-3 rounded-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {selectedDateEvents
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .map((event) => (
                <Card 
                  key={event.id} 
                  className="cursor-pointer transition-colors hover:bg-accent/50 border-border/50"
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {event.event_types && (
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: event.event_types.color }}
                            />
                          )}
                          <h4 className="font-medium text-foreground truncate">
                            {event.title}
                          </h4>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            {event.is_all_day ? (
                              <span>All day</span>
                            ) : (
                              <span>
                                {format(new Date(event.start_date), 'h:mm a')}
                                {event.end_date && format(new Date(event.end_date), 'h:mm a') !== format(new Date(event.start_date), 'h:mm a') && 
                                  ` - ${format(new Date(event.end_date), 'h:mm a')}`
                                }
                              </span>
                            )}
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1 overflow-hidden">
                              <span className="line-clamp-2">{event.description}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {event.event_types && (
                        <Badge 
                          variant="secondary" 
                          className="ml-2 text-xs flex-shrink-0"
                          style={{ 
                            backgroundColor: `${event.event_types.color}15`,
                            color: event.event_types.color,
                            borderColor: `${event.event_types.color}30`
                          }}
                        >
                          {event.event_types.label}
                        </Badge>
                      )}
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