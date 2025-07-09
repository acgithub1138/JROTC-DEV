import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventForm } from './EventForm';
import { Event } from '../CalendarManagementPage';

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  selectedDate?: Date | null;
  onSubmit: (eventData: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const EventDialog: React.FC<EventDialogProps> = ({
  open,
  onOpenChange,
  event,
  selectedDate,
  onSubmit,
  onDelete,
}) => {
  const handleSubmit = async (eventData: any) => {
    await onSubmit(eventData);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (event && onDelete) {
      await onDelete(event.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          onCancel={() => onOpenChange(false)}
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
  );
};