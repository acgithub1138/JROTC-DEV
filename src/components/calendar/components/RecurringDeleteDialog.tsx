import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface RecurringDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  isRecurringParent: boolean;
  onDeleteThis: () => void;
  onDeleteSeries: () => void;
}

export const RecurringDeleteDialog: React.FC<RecurringDeleteDialogProps> = ({
  open,
  onOpenChange,
  eventTitle,
  isRecurringParent,
  onDeleteThis,
  onDeleteSeries,
}) => {
  const handleDeleteThis = () => {
    onDeleteThis();
    onOpenChange(false);
  };

  const handleDeleteSeries = () => {
    onDeleteSeries();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <DialogTitle>Delete Recurring Event</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            "{eventTitle}" is part of a recurring series. What would you like to delete?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            variant="outline"
            onClick={handleDeleteThis}
            className="w-full"
          >
            {isRecurringParent ? 'Delete this event only' : 'Delete this occurrence only'}
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDeleteSeries}
            className="w-full"
          >
            Delete entire series
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};