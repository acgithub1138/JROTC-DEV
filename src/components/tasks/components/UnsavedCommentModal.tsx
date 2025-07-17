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
}

export const UnsavedCommentModal: React.FC<UnsavedCommentModalProps> = ({
  open,
  onAddComment,
  onDiscard,
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Comment</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved text in the comment box. Would you like to add this comment?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onDiscard}>
            Discard Comment
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAddComment}>
            Add Comment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};