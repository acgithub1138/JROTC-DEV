import React from 'react';
import ModulesManagement from '@/components/role-management/ModulesManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ModulesManagementPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <ProtectedRoute module="modules" requirePermission="read">
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Modules Management</h1>
            <p className="text-muted-foreground">
              Manage permission modules that appear in sidebars and role permissions.
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>
        </div>
        <ModulesManagement isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      </div>
    </ProtectedRoute>
  );
};

export default ModulesManagementPage;
