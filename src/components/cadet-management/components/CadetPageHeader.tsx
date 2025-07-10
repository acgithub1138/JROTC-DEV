
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface CadetPageHeaderProps {
  onAddCadet: () => void;
  onBulkImport: () => void;
}

export const CadetPageHeader = ({ onAddCadet, onBulkImport }: CadetPageHeaderProps) => {
  const { canCreate, canBulkImport } = useUserPermissions();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cadet Management</h2>
        <p className="text-muted-foreground">
          Manage cadets and command staff in your school
        </p>
      </div>
      <div className="flex gap-2">
        {canBulkImport('cadets') && (
          <Button variant="outline" onClick={onBulkImport} className="hidden md:flex">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        )}
        {canCreate('cadets') && (
          <Button onClick={onAddCadet}>
            <Plus className="w-4 h-4 mr-2" />
            Add Cadet
          </Button>
        )}
      </div>
    </div>
  );
};
