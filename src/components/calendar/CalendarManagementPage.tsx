import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarView } from './components/CalendarView';
import { EventDetailsDialog } from './components/EventDetailsDialog';
import { RecurringDeleteDialog } from './components/RecurringDeleteDialog';
import { DeleteEventDialog } from './components/DeleteEventDialog';
import { useEvents } from './hooks/useEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCalendarPermissions } from '@/hooks/useModuleSpecificPermissions';
import { format } from 'date-fns';
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
  event_assignments?: {
    id: string;
    assignee_type: 'team' | 'cadet';
    assignee_id: string;
    role?: string;
    status: 'assigned' | 'confirmed' | 'declined' | 'completed';
    assignee_name?: string;
  }[];
}
const CalendarManagementPage = () => {
  const navigate = useNavigate();
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [showRecurringDeleteDialog, setShowRecurringDeleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
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
    deleteEvent,
    deleteRecurringSeries
  } = useEvents(filters);
  const handleCreateEvent = () => {
    navigate('/app/cadets/calendar_record');
  };
  
  const handleEditEvent = (event: Event) => {
    if (!canViewDetails) return; // Don't show anything if can't view

    if (canUpdateEvents) {
      navigate(`/app/cadets/calendar_record?id=${event.id}`);
    } else {
      // Show read-only view if can view but can't update
      navigate(`/app/cadets/calendar_record?id=${event.id}&view=true`);
    }
  };
  
  const handleViewEvent = (event: Event) => {
    if (!canViewDetails) return; // Don't show anything if can't view
    setViewingEvent(event);
    setShowEventDetailsDialog(true);
  };
  
  const handleDateSelect = (date: Date) => {
    // Not needed for new implementation but kept for compatibility
  };
  
  const handleCloseDialog = () => {
    setShowEventDetailsDialog(false);
    setShowRecurringDeleteDialog(false);
    setShowDeleteDialog(false);
    setViewingEvent(null);
    setDeletingEvent(null);
  };
  
  const handleDateDoubleClick = (date: Date) => {
    if (!canCreateEvents) return;
    const dateString = format(date, 'yyyy-MM-dd');
    navigate(`/app/cadets/calendar_record?date=${dateString}`);
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
  return <div className={isMobile ? "h-screen overflow-hidden" : "p-6 space-y-6"}>
      {!isMobile && <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Calendar</h1>
          {canCreateEvents && (
            <Button onClick={handleCreateEvent} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          )}
        </div>}

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

      <EventDetailsDialog 
        open={showEventDetailsDialog} 
        onOpenChange={handleCloseDialog} 
        event={viewingEvent} 
      />

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