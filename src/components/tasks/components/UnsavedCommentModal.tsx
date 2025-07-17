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

interface UnsavedCommentModalProps {
  open: boolean;
  onAddComment: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedCommentModal: React.FC<UnsavedCommentModalProps> = ({
  open,
  onAddComment,
  onDiscard,
  onCancel,
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Comment</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved text in the comment box. Would you like to add this comment before saving the task?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogCancel onClick={onDiscard}>
            Discard Comment
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAddComment}>
            Add Comment & Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};