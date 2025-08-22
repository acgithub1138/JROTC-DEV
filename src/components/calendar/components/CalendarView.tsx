import React, { useState } from 'react';
import { Event } from '../CalendarManagementPage';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarToolbar, CalendarViewType } from './CalendarToolbar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { ListView } from './ListView';
import { MobileCalendarView } from './MobileCalendarView';
import { format, startOfMonth, startOfWeek, startOfDay } from 'date-fns';

interface CalendarViewProps {
  events: Event[];
  isLoading: boolean;
  onEventEdit?: (event: Event) => void;
  onEventView?: (event: Event) => void;
  onEventDelete?: (id: string) => void;
  onDateSelect: (date: Date) => void;
  onCreateEvent?: () => void;
  onDateDoubleClick?: (date: Date) => void;
  filters: {
    eventType: string;
    assignedTo: string;
  };
  onFiltersChange: (filters: { eventType: string; assignedTo: string }) => void;
  readOnly?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  isLoading,
  onEventEdit,
  onEventView,
  onEventDelete,
  onDateSelect,
  onCreateEvent,
  onDateDoubleClick,
  filters,
  onFiltersChange,
  readOnly = false,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const isMobile = useIsMobile();

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    onDateSelect(date);
  };

  // Mobile view - iOS-style calendar with daily events
  if (isMobile) {
    return (
      <MobileCalendarView
        events={events}
        onEventEdit={onEventEdit}
        onEventView={onEventView}
        onCreateEvent={onCreateEvent}
        onDateSelect={handleDateSelect}
        onDateDoubleClick={onDateDoubleClick}
        readOnly={readOnly}
      />
    );
  }


  const handleTimeSlotClick = (date: Date, hour: number) => {
    if (readOnly || !onCreateEvent) return;
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hour, 0, 0, 0);
    onDateSelect(selectedDateTime);
    onCreateEvent();
  };

  const handleViewChange = (newView: CalendarViewType) => {
    setViewType(newView);
    
    // Adjust current date based on view type
    switch (newView) {
      case 'day':
        setCurrentDate(startOfDay(currentDate));
        break;
      case 'week':
        setCurrentDate(startOfWeek(currentDate, { weekStartsOn: 0 }));
        break;
      case 'month':
        setCurrentDate(startOfMonth(currentDate));
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CalendarToolbar
        currentDate={currentDate}
        viewType={viewType}
        onDateChange={setCurrentDate}
        onViewChange={handleViewChange}
        onCreateEvent={onCreateEvent}
        selectedEventType={filters.eventType || 'all'}
        onEventTypeChange={(eventType) => onFiltersChange({ ...filters, eventType: eventType === 'all' ? '' : eventType })}
        readOnly={readOnly}
      />

      <div className="calendar-content">
        {viewType === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventEdit || onEventView}
            onDateClick={handleDateSelect}
            onDateDoubleClick={readOnly ? undefined : onDateDoubleClick}
          />
        )}
        
        {viewType === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventEdit || onEventView}
            onTimeSlotClick={readOnly ? undefined : handleTimeSlotClick}
          />
        )}
        
        {viewType === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventEdit || onEventView}
            onTimeSlotClick={readOnly ? undefined : handleTimeSlotClick}
          />
        )}
        
        {viewType === 'list' && (
          <ListView
            events={events}
            onEventClick={onEventEdit || onEventView}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
};