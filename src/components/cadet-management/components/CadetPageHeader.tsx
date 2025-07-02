
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

interface CadetPageHeaderProps {
  onAddCadet: () => void;
  onBulkImport: () => void;
}

export const CadetPageHeader = ({ onAddCadet, onBulkImport }: CadetPageHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cadet Management</h2>
        <p className="text-muted-foreground">
          Manage cadets and command staff in your school
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBulkImport}>
          <Upload className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
        <Button onClick={onAddCadet}>
          <Plus className="w-4 h-4 mr-2" />
          Add Cadet
        </Button>
      </div>
    </div>
  );
};
