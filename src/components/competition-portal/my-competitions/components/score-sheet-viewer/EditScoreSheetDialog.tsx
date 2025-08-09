import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CompetitionEvent } from './types';

interface EditScoreSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CompetitionEvent | null;
  onEventUpdated: () => void;
}

export const EditScoreSheetDialog: React.FC<EditScoreSheetDialogProps> = ({
  open,
  onOpenChange,
  event,
  onEventUpdated
}) => {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Score Sheet</DialogTitle>
        </DialogHeader>
        <div className="text-center py-8 text-muted-foreground">
          Score sheet editing functionality will be implemented here
        </div>
      </DialogContent>
    </Dialog>
  );
};