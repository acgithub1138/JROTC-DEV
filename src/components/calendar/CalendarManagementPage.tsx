import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarView } from './components/CalendarView';
import { EventDialog } from './components/EventDialog';
import { useEvents } from './hooks/useEvents';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Event {
  id: string;
  school_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  event_type: 'training' | 'competition' | 'ceremony' | 'meeting' | 'drill' | 'other';
  is_all_day: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const CalendarManagementPage = () => {
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const isMobile = useIsMobile();

  const {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents({ eventType: eventTypeFilter === 'all' ? '' : eventTypeFilter, assignedTo: '' });

  // Show loading state if events are loading
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Calendar</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCloseDialog = () => {
    setShowEventDialog(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handleEventSubmit = async (eventData: any) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData);
    } else {
      await createEvent(eventData);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calendar</h1>
      </div>

      <CalendarView
        events={events}
        isLoading={isLoading}
        onEventEdit={handleEditEvent}
        onEventDelete={deleteEvent}
        onDateSelect={handleDateSelect}
        onCreateEvent={handleCreateEvent}
        selectedEventType={eventTypeFilter}
        onEventTypeChange={setEventTypeFilter}
      />

      <EventDialog
        open={showEventDialog}
        onOpenChange={handleCloseDialog}
        event={editingEvent}
        selectedDate={selectedDate}
        onSubmit={handleEventSubmit}
      />
    </div>
  );
};

export default CalendarManagementPage;