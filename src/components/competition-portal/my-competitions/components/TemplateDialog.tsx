import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TemplateForm } from './TemplateForm';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import type { CompetitionTemplate } from '../types';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: CompetitionTemplate | null;
  onSubmit: (data: any) => Promise<void>;
}

export const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  onSubmit
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmClose = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      setHasUnsavedChanges(false);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setHasUnsavedChanges(false);
      setShowUnsavedDialog(false);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {template ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          
          <TemplateForm
            template={template}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            onFormChange={(hasChanges) => setHasUnsavedChanges(hasChanges)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleConfirmClose}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
};