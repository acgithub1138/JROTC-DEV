import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
interface UnsavedCommentModalProps {
  open: boolean;
  onAddComment: () => void;
  onDiscard: () => void;
}
export const UnsavedCommentModal: React.FC<UnsavedCommentModalProps> = ({
  open,
  onAddComment,
  onDiscard
}) => {
  return <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">Unsaved Comment</AlertDialogTitle>
          <AlertDialogDescription className="text-center">You have unsaved text in the comment box. Please click Add or Discard Comment, then click Save again.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-2 w-full">
          <AlertDialogCancel onClick={onDiscard}>
            Discard Comment
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAddComment}>
            Add Comment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>;
};