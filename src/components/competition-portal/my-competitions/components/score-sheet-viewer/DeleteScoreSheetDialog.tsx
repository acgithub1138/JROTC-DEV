import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CompetitionEvent } from './types';

interface DeleteScoreSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CompetitionEvent | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteScoreSheetDialog: React.FC<DeleteScoreSheetDialogProps> = ({
  open,
  onOpenChange,
  event,
  onConfirm,
  isDeleting = false
}) => {
  if (!event) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Score Sheet</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this score sheet for <strong>{event.event}</strong>?
            This action cannot be undone and all scoring data will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Score Sheet'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};