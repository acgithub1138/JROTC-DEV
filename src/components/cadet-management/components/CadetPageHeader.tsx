
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CadetPageHeaderProps {
  onAddCadet: () => void;
}

export const CadetPageHeader = ({ onAddCadet }: CadetPageHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cadet Management</h2>
        <p className="text-muted-foreground">
          Manage cadets and command staff in your school
        </p>
      </div>
      <Button onClick={onAddCadet}>
        <Plus className="w-4 h-4 mr-2" />
        Add Cadet
      </Button>
    </div>
  );
};
