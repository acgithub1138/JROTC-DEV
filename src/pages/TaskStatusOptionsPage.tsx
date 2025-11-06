import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { StatusOptionsTab } from '@/components/tasks/options/StatusOptionsTab';

const TaskStatusOptionsPage: React.FC = () => {
  return (
    <ProtectedRoute module="task_status_options" requirePermission="read">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Task Status Options</h1>
            <p className="text-muted-foreground">
              Manage global status options for all tasks
            </p>
          </div>
        </div>
        <StatusOptionsTab />
      </div>
    </ProtectedRoute>
  );
};

export default TaskStatusOptionsPage;
