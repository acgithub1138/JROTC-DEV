import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventForm } from './EventForm';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { Event } from '../CalendarManagementPage';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  selectedDate?: Date | null;
  onSubmit: (eventData: any) => Promise<void>;
  onDelete?: (event: Event) => void;
}

export const EventDialog: React.FC<EventDialogProps> = ({
  open,
  onOpenChange,
  event,
  selectedDate,
  onSubmit,
  onDelete,
}) => {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const handleSubmit = async (eventData: any) => {
    await onSubmit(eventData);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (event && onDelete) {
      await onDelete(event);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // We'll let the EventForm handle this through onCancel
      return;
    }
    onOpenChange(newOpen);
  };

  const handleCancel = (hasUnsavedChanges: boolean) => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {event ? 'Edit Event' : 'Create Event'}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            event={event}
            selectedDate={selectedDate}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onDelete={event && onDelete ? handleDelete : undefined}
          />
          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            Location search powered by{' '}
            <a 
              href="https://www.openstreetmap.org/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline hover:text-foreground"
            >
              OpenStreetMap
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </>
  );
};