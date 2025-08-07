import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarView } from './components/CalendarView';
import { EventDialog } from './components/EventDialog';
import { EventDetailsDialog } from './components/EventDetailsDialog';
import { EventFilters } from './components/EventFilters';
import { RecurringDeleteDialog } from './components/RecurringDeleteDialog';
import { DeleteEventDialog } from './components/DeleteEventDialog';
import { useEvents } from './hooks/useEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCalendarPermissions } from '@/hooks/useModuleSpecificPermissions';
export interface Event {
  id: string;
  school_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  event_type: string; // References event_types table ID
  event_types?: {
    id: string;
    label: string;
    color: string;
  };
  is_all_day: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_recurring?: boolean;
  recurrence_rule?: any;
  recurrence_end_date?: string;
  parent_event_id?: string;
}
const CalendarManagementPage = () => {
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [showRecurringDeleteDialog, setShowRecurringDeleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    eventType: '',
    assignedTo: ''
  });
  const isMobile = useIsMobile();
  const {
    canCreate: canCreateEvents,
    canUpdate: canUpdateEvents,
    canDelete: canDeleteEvents,
    canViewDetails
  } = useCalendarPermissions();
  const {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    deleteRecurringSeries
  } = useEvents(filters);
  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventDialog(true);
  };
  const handleEditEvent = (event: Event) => {
    if (!canViewDetails) return; // Don't show anything if can't view
    
    if (canUpdateEvents) {
      setEditingEvent(event);
      setShowEventDialog(true);
    } else {
      // Show read-only view if can view but can't update
      setViewingEvent(event);
      setShowEventDetailsDialog(true);
    }
  };
  
  const handleViewEvent = (event: Event) => {
    if (!canViewDetails) return; // Don't show anything if can't view
    setViewingEvent(event);
    setShowEventDetailsDialog(true);
  };
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  const handleCloseDialog = () => {
    setShowEventDialog(false);
    setShowEventDetailsDialog(false);
    setShowRecurringDeleteDialog(false);
    setShowDeleteDialog(false);
    setEditingEvent(null);
    setViewingEvent(null);
    setDeletingEvent(null);
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
    if (!canCreateEvents) return;
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  const handleDeleteEvent = (event: Event) => {
    // Check if this is a recurring event
    if (event.is_recurring || event.parent_event_id) {
      setDeletingEvent(event);
      setShowRecurringDeleteDialog(true);
    } else {
      // Regular single event - show confirmation dialog
      setDeletingEvent(event);
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteEventById = async (id: string) => {
    // Find the event by ID first
    const event = events.find(e => e.id === id);
    if (event) {
      handleDeleteEvent(event);
    } else {
      // Fallback to direct deletion if event not found
      await deleteEvent(id);
    }
  };

  const handleDeleteThisEvent = async () => {
    if (deletingEvent) {
      await deleteEvent(deletingEvent.id);
      handleCloseDialog();
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (deletingEvent) {
      await deleteEvent(deletingEvent.id);
      handleCloseDialog();
    }
  };

  const handleDeleteSeries = async () => {
    if (deletingEvent) {
      // If it's an instance, get the parent ID, otherwise use the event ID
      const parentId = deletingEvent.parent_event_id || deletingEvent.id;
      await deleteRecurringSeries(parentId);
      handleCloseDialog();
    }
  };
  return <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Calendar</h1>
        {canCreateEvents}
      </div>

      <CalendarView 
        events={events} 
        isLoading={isLoading} 
        onEventEdit={canViewDetails ? handleEditEvent : undefined} 
        onEventView={canViewDetails ? handleViewEvent : undefined} 
        onEventDelete={canCreateEvents ? handleDeleteEventById : undefined} 
        onDateSelect={handleDateSelect} 
        onDateDoubleClick={handleDateDoubleClick} 
        onCreateEvent={canCreateEvents ? handleCreateEvent : undefined} 
        filters={filters} 
        onFiltersChange={setFilters} 
        readOnly={!canCreateEvents} 
      />

      {(canCreateEvents || canUpdateEvents) && (
        <EventDialog 
          open={showEventDialog} 
          onOpenChange={handleCloseDialog} 
          event={editingEvent} 
          selectedDate={selectedDate} 
          onSubmit={handleEventSubmit} 
          onDelete={canDeleteEvents ? handleDeleteEvent : undefined} 
        />
      )}

      <EventDetailsDialog open={showEventDetailsDialog} onOpenChange={handleCloseDialog} event={viewingEvent} />

      <RecurringDeleteDialog
        open={showRecurringDeleteDialog}
        onOpenChange={setShowRecurringDeleteDialog}
        eventTitle={deletingEvent?.title || ''}
        isRecurringParent={deletingEvent?.is_recurring || false}
        onDeleteThis={handleDeleteThisEvent}
        onDeleteSeries={handleDeleteSeries}
      />

      <DeleteEventDialog 
        open={showDeleteDialog} 
        onOpenChange={() => setShowDeleteDialog(false)} 
        event={deletingEvent} 
        onConfirm={handleConfirmSingleDelete} 
        loading={false}
      />
    </div>;
};
export default CalendarManagementPage;