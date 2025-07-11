import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotesViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  notes: string;
  judgeNumber?: string;
}

export const NotesViewDialog: React.FC<NotesViewDialogProps> = ({
  open,
  onOpenChange,
  fieldName,
  notes,
  judgeNumber
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {fieldName} - {judgeNumber || 'Notes'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] w-full p-4 border rounded-md bg-muted/20">
          <div className="whitespace-pre-wrap text-sm">
            {notes || 'No notes provided'}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};