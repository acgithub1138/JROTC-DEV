
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';

interface CadetPageHeaderProps {
  onAddCadet: () => void;
  onBulkImport: () => void;
  onAddPTTest: () => void;
}

export const CadetPageHeader = ({ onAddCadet, onBulkImport, onAddPTTest }: CadetPageHeaderProps) => {
  const { canCreate, canBulkImport } = useCadetPermissions();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cadet Management</h2>
        <p className="text-muted-foreground">
          Manage cadets and command staff in your school
        </p>
      </div>
      <div className="flex gap-2">
        {canCreate && (
          <Button variant="outline" onClick={onAddPTTest}>
            <Plus className="w-4 h-4 mr-2" />
            PT Test
          </Button>
        )}
        {canBulkImport && (
          <Button variant="outline" onClick={onBulkImport} className="hidden md:flex">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        )}
        {canCreate && (
          <Button onClick={onAddCadet}>
            <Plus className="w-4 h-4 mr-2" />
            Add Cadet
          </Button>
        )}
      </div>
    </div>
  );
};
