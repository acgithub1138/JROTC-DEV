import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PriorityOptionsTab } from '@/components/tasks/options/PriorityOptionsTab';

const TaskPriorityOptionsPage: React.FC = () => {
  return (
    <ProtectedRoute module="task_priority_options" requirePermission="read">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Task Priority Options</h1>
            <p className="text-muted-foreground">
              Manage global priority options for all tasks
            </p>
          </div>
        </div>
        <PriorityOptionsTab />
      </div>
    </ProtectedRoute>
  );
};

export default TaskPriorityOptionsPage;
