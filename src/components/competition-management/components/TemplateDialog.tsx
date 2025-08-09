import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { Button } from '@/components/ui/button';
import { TemplateForm } from './TemplateForm';
import { CompetitionTemplate } from '../types';
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
  const [useBuilder, setUseBuilder] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(newOpen);
      if (!newOpen) {
        setHasUnsavedChanges(false);
      }
    }
  };
  const handleDiscardChanges = () => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowConfirmDialog(false);
  };
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle>
              {template ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setUseBuilder(!useBuilder)}>
              {useBuilder ? 'Manual JSON' : 'Field Builder'}
            </Button>
          </DialogHeader>
          <TemplateForm template={template} onSubmit={handleSubmit} onCancel={() => handleOpenChange(false)} onFormChange={setHasUnsavedChanges} useBuilder={useBuilder} />
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog 
        open={showConfirmDialog} 
        onOpenChange={setShowConfirmDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
        title="Unsaved Changes"
        description="You have unsaved changes that will be lost if you close this form. Are you sure you want to continue?"
      />
    </>;
};