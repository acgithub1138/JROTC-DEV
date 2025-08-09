import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Notes for {fieldName}
            {judgeNumber && <Badge variant="outline">{judgeNumber}</Badge>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm whitespace-pre-wrap">{notes}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};