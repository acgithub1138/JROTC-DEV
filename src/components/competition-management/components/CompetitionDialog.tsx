import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CompetitionForm } from './CompetitionForm';
import { Competition } from '../types';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
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
  onSubmit
}) => {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [formData, setFormData] = useState<any>(competition || {});

  const initialData = competition || {};

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: formData,
    enabled: open
  });

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    resetChanges();
    onOpenChange(false);
  };

  const handleFormDataChange = (data: any) => {
    setFormData(data);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(open);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setFormData(competition || {});
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {competition ? 'Edit Competition' : 'Add Competition'}
            </DialogTitle>
          </DialogHeader>
          <CompetitionForm 
            competition={competition} 
            onSubmit={handleSubmit} 
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </>
  );
};