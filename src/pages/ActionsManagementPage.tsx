import React from 'react';
import { ActionsManagement } from '@/components/role-management/ActionsManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const ActionsManagementPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <ProtectedRoute module="actions" requirePermission="read">
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Actions Management</h1>
            <p className="text-muted-foreground">
              Manage permission actions that can be assigned to roles.
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Action
          </Button>
        </div>
        <ActionsManagement isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      </div>
    </ProtectedRoute>
  );
};

export default ActionsManagementPage;
