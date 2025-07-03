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
            {competition ? 'Edit Competition' : 'Create Competition'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Competition form will be implemented here.</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};