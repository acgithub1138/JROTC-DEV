import React, { useState } from 'react';
import { Event } from '../CalendarManagementPage';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarToolbar, CalendarViewType } from './CalendarToolbar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AgendaView } from './AgendaView';
import { format, startOfMonth, startOfWeek, startOfDay } from 'date-fns';

interface CalendarViewProps {
  events: Event[];
  isLoading: boolean;
  onEventEdit: (event: Event) => void;
  onEventDelete: (id: string) => void;
  onDateSelect: (date: Date) => void;
  onCreateEvent: () => void;
  filters: {
    eventType: string;
    assignedTo: string;
  };
  onFiltersChange: (filters: { eventType: string; assignedTo: string }) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  isLoading,
  onEventEdit,
  onEventDelete,
  onDateSelect,
  onCreateEvent,
  filters,
  onFiltersChange,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const isMobile = useIsMobile();

  // Mobile view - simplified agenda view
  if (isMobile) {
    return (
      <div className="space-y-4">
        <CalendarToolbar
          currentDate={currentDate}
          viewType="agenda"
          onDateChange={setCurrentDate}
          onViewChange={() => {}} // No view switching on mobile
          onCreateEvent={onCreateEvent}
          selectedEventType={filters.eventType || 'all'}
          onEventTypeChange={(eventType) => onFiltersChange({ ...filters, eventType: eventType === 'all' ? '' : eventType })}
        />
        
        <AgendaView
          currentDate={currentDate}
          events={events}
          onEventClick={onEventEdit}
        />
      </div>
    );
  }

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    onDateSelect(date);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
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
      case 'agenda':
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
      />

      <div className="calendar-content">
        {viewType === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventEdit}
            onDateClick={handleDateSelect}
          />
        )}
        
        {viewType === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventEdit}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
        
        {viewType === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventEdit}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
        
        {viewType === 'agenda' && (
          <AgendaView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventEdit}
          />
        )}
      </div>
    </div>
  );
};