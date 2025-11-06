import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CompetitionEventTypesManagement from '@/components/competition-management/CompetitionEventTypesManagement';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissionContext } from '@/contexts/PermissionContext';

const CompetitionEventTypesPageContent: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasPermission } = usePermissionContext();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competition Event Types</h1>
          <p className="text-muted-foreground mt-1">
            Manage event types for competitions
          </p>
        </div>
        {hasPermission('comp_event_types', 'create') && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event Type
          </Button>
        )}
      </div>
      <CompetitionEventTypesManagement 
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
};

const CompetitionEventTypesPage: React.FC = () => {
  return (
    <ProtectedRoute module="comp_event_types" requirePermission="read">
      <CompetitionEventTypesPageContent />
    </ProtectedRoute>
  );
};

export default CompetitionEventTypesPage;
