import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarView } from './components/CalendarView';
import { EventDialog } from './components/EventDialog';
import { EventDetailsDialog } from './components/EventDetailsDialog';
import { EventFilters } from './components/EventFilters';
import { useEvents } from './hooks/useEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRolePermissions } from '@/hooks/useRolePermissions';

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
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    eventType: '',
    assignedTo: '',
  });
  const isMobile = useIsMobile();
  const { canCreateEvents } = useRolePermissions();

  const {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents(filters);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleViewEvent = (event: Event) => {
    setViewingEvent(event);
    setShowEventDetailsDialog(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCloseDialog = () => {
    setShowEventDialog(false);
    setShowEventDetailsDialog(false);
    setEditingEvent(null);
    setViewingEvent(null);
    setSelectedDate(null);
  };

  const handleEventSubmit = async (eventData: any) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData);
    } else {
      await createEvent(eventData);
    }
  };

  const handleDateDoubleClick = (date: Date) => {
    if (!canCreateEvents()) return;
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calendar</h1>
      </div>

      <CalendarView
        events={events}
        isLoading={isLoading}
        onEventEdit={canCreateEvents() ? handleEditEvent : undefined}
        onEventView={!canCreateEvents() ? handleViewEvent : undefined}
        onEventDelete={canCreateEvents() ? deleteEvent : undefined}
        onDateSelect={handleDateSelect}
        onDateDoubleClick={handleDateDoubleClick}
        onCreateEvent={canCreateEvents() ? handleCreateEvent : undefined}
        filters={filters}
        onFiltersChange={setFilters}
        readOnly={!canCreateEvents()}
      />

      {canCreateEvents() && (
        <EventDialog
          open={showEventDialog}
          onOpenChange={handleCloseDialog}
          event={editingEvent}
          selectedDate={selectedDate}
          onSubmit={handleEventSubmit}
          onDelete={deleteEvent}
        />
      )}

      <EventDetailsDialog
        open={showEventDetailsDialog}
        onOpenChange={handleCloseDialog}
        event={viewingEvent}
      />
    </div>
  );
};

export default CalendarManagementPage;