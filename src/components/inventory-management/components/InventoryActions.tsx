import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { useInventoryPermissions } from '@/hooks/useModuleSpecificPermissions';
import { usePermissionContext } from '@/contexts/PermissionContext';

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
  const { canBulkImport } = useInventoryPermissions();
  const { isLoading } = usePermissionContext();

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
      <Button onClick={onAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </>
  );
};