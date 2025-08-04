import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CompetitionForm } from './CompetitionForm';
import { Competition } from '../types';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

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
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    setHasInteracted(false);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasInteracted) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(newOpen);
      if (!newOpen) {
        setHasInteracted(false);
      }
    }
  };

  const handleCancel = () => {
    if (hasInteracted) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    setHasInteracted(false);
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  // Track when user starts interacting with the form
  const handleFormInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
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
            onFormInteraction={handleFormInteraction}
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