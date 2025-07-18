import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryItemForm } from './InventoryItemForm';
import { useTablePermissions } from '@/hooks/useTablePermissions';
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
  viewOnly = false,
}) => {
  const { canEdit: canUpdate } = useTablePermissions('inventory');
  const isReadOnly = viewOnly || !canUpdate;

  const handleSubmit = async (data: any) => {
    if (!isReadOnly) {
      await onSubmit({ id: item.id, ...data });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewOnly ? 'View Inventory Item' : (isReadOnly ? 'View Inventory Item' : 'Edit Inventory Item')}
          </DialogTitle>
        </DialogHeader>
        <InventoryItemForm 
          initialData={item}
          onSubmit={handleSubmit} 
          onCancel={() => onOpenChange(false)}
          readOnly={isReadOnly}
        />
      </DialogContent>
    </Dialog>
  );
};