import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryItemForm } from './InventoryItemForm';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import type { Tables } from '@/integrations/supabase/types';

interface EditInventoryItemDialogProps {
  item: Tables<'inventory_items'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: any) => Promise<void>;
}

export const EditInventoryItemDialog: React.FC<EditInventoryItemDialogProps> = ({
  item,
  open,
  onOpenChange,
  onSubmit,
}) => {
  const { canUpdate } = useUserPermissions();
  const isReadOnly = !canUpdate('inventory');

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
            {isReadOnly ? 'View Inventory Item' : 'Edit Inventory Item'}
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