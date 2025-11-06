import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PriorityOptionsTab } from '@/components/tasks/options/PriorityOptionsTab';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const TaskPriorityOptionsPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <ProtectedRoute module="task_priority" requirePermission="read">
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Priority Options</h1>
            <p className="text-muted-foreground">
              Manage global priority options for all tasks
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Priority
          </Button>
        </div>
        <PriorityOptionsTab 
          isDialogOpen={isDialogOpen} 
          setIsDialogOpen={setIsDialogOpen}
        />
      </div>
    </ProtectedRoute>
  );
};

export default TaskPriorityOptionsPage;
