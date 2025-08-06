import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { CPCompetitionForm } from './CPCompetitionForm';
interface CPCompetitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition?: any;
  onSubmit: (data: any) => Promise<void>;
}
export const CPCompetitionDialog: React.FC<CPCompetitionDialogProps> = ({
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
    setShowUnsavedDialog(false);
    setHasInteracted(false);
    onOpenChange(false);
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };
  const handleFormInteraction = () => {
    setHasInteracted(true);
  };
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {competition ? 'Edit Competition' : 'Create New Competition'}
            </DialogTitle>
            <DialogDescription>
              {competition ? 'Update the competition details below.' : 'Fill in the details to create a new competition.'}
            </DialogDescription>
          </DialogHeader>
          <CPCompetitionForm onSubmit={handleSubmit} onCancel={handleCancel} onInteraction={handleFormInteraction} competition={competition} />
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} title="Unsaved Changes" description="You have unsaved changes to the competition. Are you sure you want to discard them?" />
    </>;
};