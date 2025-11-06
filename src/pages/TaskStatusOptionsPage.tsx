import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { StatusOptionsTab } from '@/components/tasks/options/StatusOptionsTab';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissionContext } from '@/contexts/PermissionContext';

const TaskStatusOptionsPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { hasPermission } = usePermissionContext();
  const canCreate = hasPermission('task_status', 'create');

  return (
    <ProtectedRoute module="task_status" requirePermission="read">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Task Status Options</h1>
            <p className="text-muted-foreground">
              Manage global status options for all tasks
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Status
            </Button>
          )}
        </div>
        <StatusOptionsTab isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      </div>
    </ProtectedRoute>
  );
};

export default TaskStatusOptionsPage;
