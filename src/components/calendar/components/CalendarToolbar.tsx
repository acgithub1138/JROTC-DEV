import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, startOfDay } from 'date-fns';
import { useEventTypes } from '../hooks/useEventTypes';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarToolbarProps {
  currentDate: Date;
  viewType: CalendarViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarViewType) => void;
  onCreateEvent: () => void;
  selectedEventType?: string;
  onEventTypeChange: (eventType: string) => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDate,
  viewType,
  onDateChange,
  onViewChange,
  onCreateEvent,
  selectedEventType,
  onEventTypeChange,
}) => {
  const { eventTypes } = useEventTypes();
  const handlePrevious = () => {
    switch (viewType) {
      case 'day':
        onDateChange(addDays(currentDate, -1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, -1));
        break;
      case 'month':
      case 'agenda':
        onDateChange(addMonths(currentDate, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewType) {
      case 'day':
        onDateChange(addDays(currentDate, 1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'month':
      case 'agenda':
        onDateChange(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    const today = new Date();
    switch (viewType) {
      case 'day':
        onDateChange(startOfDay(today));
        break;
      case 'week':
        onDateChange(startOfWeek(today, { weekStartsOn: 0 }));
        break;
      case 'month':
      case 'agenda':
        onDateChange(startOfMonth(today));
        break;
    }
  };

  const getDateDisplayText = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'agenda':
        return format(currentDate, 'MMMM yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 bg-card p-4 rounded-lg border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={viewType} onValueChange={onViewChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-lg">{getDateDisplayText()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={selectedEventType} onValueChange={onEventTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {eventTypes.map(type => (
              <SelectItem key={type.id} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onCreateEvent} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>
    </div>
  );
};