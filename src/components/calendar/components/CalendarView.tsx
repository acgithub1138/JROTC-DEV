import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Edit, Trash2, MapPin, Clock } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Event } from '../CalendarManagementPage';
import { useIsMobile } from '@/hooks/use-mobile';

interface CalendarViewProps {
  events: Event[];
  isLoading: boolean;
  onEventEdit: (event: Event) => void;
  onEventDelete: (id: string) => void;
  onDateSelect: (date: Date) => void;
}

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'training': return 'bg-blue-100 text-blue-800';
    case 'competition': return 'bg-red-100 text-red-800';
    case 'ceremony': return 'bg-purple-100 text-purple-800';
    case 'meeting': return 'bg-green-100 text-green-800';
    case 'drill': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  isLoading,
  onEventEdit,
  onEventDelete,
  onDateSelect,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const isMobile = useIsMobile();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect(date);
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.start_date), date));
  };

  const getEventsForMonth = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });
  };

  const renderEventCard = (event: Event) => (
    <Card key={event.id} className="mb-2">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{event.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              {event.is_all_day ? 'All day' : format(new Date(event.start_date), 'h:mm a')}
              {event.location && (
                <>
                  <MapPin className="w-3 h-3 ml-2" />
                  {event.location}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge className={getEventTypeColor(event.event_type)} variant="secondary">
              {event.event_type}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEventEdit(event)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEventDelete(event.id)}
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </Button>
          </div>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {getEventsForMonth().length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No events this month
              </CardContent>
            </Card>
          ) : (
            getEventsForMonth()
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
              .map(renderEventCard)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="w-full"
              modifiers={{
                hasEvents: (date) => getEventsForDate(date).length > 0
              }}
              modifiersClassNames={{
                hasEvents: "bg-primary/20 font-bold"
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>
              Events - {format(selectedDate, 'MMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No events for this date
                </p>
              ) : (
                getEventsForDate(selectedDate).map(renderEventCard)
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};