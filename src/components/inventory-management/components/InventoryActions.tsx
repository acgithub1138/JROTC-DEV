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
  const { canCreate, canBulkImport } = useInventoryPermissions();
  const { isLoading } = usePermissionContext();

  // Debug logging for button visibility
  console.log('InventoryActions render:', { 
    canCreate, 
    canBulkImport, 
    isLoading,
    timestamp: new Date().toISOString()
  });

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