import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { useInventoryActionsPermissions } from '@/hooks/useOptimizedInventoryPermissions';

interface InventoryActionsProps {
  onAddItem: () => void;
  onBulkOperations: () => void;
  onExport: () => void;
}

export const InventoryActions: React.FC<InventoryActionsProps> = ({
  onAddItem,
  onBulkOperations,
  onExport
}) => {
  const { canCreate, canBulkImport, isLoading } = useInventoryActionsPermissions();

  return (
    <>
      <Button variant="outline" onClick={onExport}>
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      {(canBulkImport || isLoading) && (
        <Button variant="outline" onClick={onBulkOperations} disabled={isLoading}>
          <Upload className="w-4 h-4 mr-2" />
          Bulk Operations
        </Button>
      )}
      {(canCreate || isLoading) && (
        <Button onClick={onAddItem} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      )}
    </>
  );
};