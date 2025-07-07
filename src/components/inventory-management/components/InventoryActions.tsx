import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';

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
  return (
    <>
      <Button variant="outline" onClick={onExport}>
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
      <Button variant="outline" onClick={onBulkOperations}>
        <Upload className="w-4 h-4 mr-2" />
        Bulk Operations
      </Button>
      <Button onClick={onAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </>
  );
};