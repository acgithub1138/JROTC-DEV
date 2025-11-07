
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';

interface CadetPageHeaderProps {
  onAddCadet: () => void;
}

export const CadetPageHeader = ({ onAddCadet }: CadetPageHeaderProps) => {
  const navigate = useNavigate();
  const { canCreate, canBulkImport } = useCadetPermissions();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cadet Management</h2>
        <p className="text-muted-foreground">
          Manage cadets and command staff in your school
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {canBulkImport && (
          <Button variant="outline" onClick={() => navigate('/app/cadets/cadet_bulk_upload')} className="w-full sm:w-auto">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        )}
        {canCreate && (
          <Button onClick={onAddCadet} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Cadet
          </Button>
        )}
      </div>
    </div>
  );
};
