import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CompetitionForm } from './CompetitionForm';
import { Competition } from '../types';

interface CompetitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition?: Competition | null;
  onSubmit: (data: any) => Promise<void>;
}

export const CompetitionDialog: React.FC<CompetitionDialogProps> = ({
  open,
  onOpenChange,
  competition,
  onSubmit,
}) => {
  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {competition ? 'Edit Competition' : 'Add Competition'}
          </DialogTitle>
        </DialogHeader>
        <CompetitionForm
          competition={competition}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};