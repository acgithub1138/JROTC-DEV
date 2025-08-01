import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryItemForm } from './InventoryItemForm';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import type { Tables } from '@/integrations/supabase/types';
interface EditInventoryItemDialogProps {
  item: Tables<'inventory_items'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: any) => Promise<void>;
  viewOnly?: boolean;
}
export const EditInventoryItemDialog: React.FC<EditInventoryItemDialogProps> = ({
  item,
  open,
  onOpenChange,
  onSubmit,
  viewOnly = false
}) => {
  const {
    canEdit: canUpdate
  } = useTablePermissions('inventory');
  const isReadOnly = viewOnly || !canUpdate;
  const [currentFormData, setCurrentFormData] = useState<any>(item || {});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData: item || {},
    currentData: currentFormData,
    enabled: !isReadOnly
  });

  // Update form data when item changes
  useEffect(() => {
    if (item) {
      setCurrentFormData(item);
      resetChanges();
    }
  }, [item, resetChanges]);
  const handleSubmit = async (data: any) => {
    if (!isReadOnly) {
      await onSubmit({
        id: item.id,
        ...data
      });
      resetChanges();
      onOpenChange(false);
    }
  };
  const handleFormDataChange = (data: any) => {
    setCurrentFormData(data);
  };
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };
  const handleUnsavedDiscard = () => {
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };
  const handleUnsavedCancel = () => {
    setShowUnsavedDialog(false);
  };
  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      if (!open) {
        onOpenChange(false);
      }
    }
  };
  return <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewOnly ? 'View Inventory Item' : isReadOnly ? 'View Inventory Item' : 'Edit Inventory Item'}
            </DialogTitle>
          </DialogHeader>
          <InventoryItemForm initialData={item} onSubmit={handleSubmit} onCancel={handleCancel} onDataChange={handleFormDataChange} readOnly={isReadOnly} />
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleUnsavedDiscard} onCancel={handleUnsavedCancel} />
    </>;
};