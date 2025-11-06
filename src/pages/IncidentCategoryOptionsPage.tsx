import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { IncidentCategoryOptionsTab } from '@/components/incident-management/options/IncidentCategoryOptionsTab';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissionContext } from '@/contexts/PermissionContext';

const IncidentCategoryOptionsPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { hasPermission } = usePermissionContext();
  const canCreate = hasPermission('incident_category', 'create');

  return (
    <ProtectedRoute module="incident_category" requirePermission="read">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Incident Category Options</h1>
            <p className="text-muted-foreground">
              Manage global category options for all incidents
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          )}
        </div>
        <IncidentCategoryOptionsTab isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      </div>
    </ProtectedRoute>
  );
};

export default IncidentCategoryOptionsPage;
