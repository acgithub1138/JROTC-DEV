import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { StatusOptionsTab } from '@/components/tasks/options/StatusOptionsTab';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const TaskStatusOptionsPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <ProtectedRoute module="task_status" requirePermission="read">
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Status Options</h1>
            <p className="text-muted-foreground">
              Manage global status options for all tasks
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>
        <StatusOptionsTab 
          isDialogOpen={isDialogOpen} 
          setIsDialogOpen={setIsDialogOpen}
        />
      </div>
    </ProtectedRoute>
  );
};

export default TaskStatusOptionsPage;
