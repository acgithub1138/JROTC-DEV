import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { useMyTasks } from '@/hooks/useMyTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { getStatusColorClass, getPriorityColorClass, getStatusLabel } from '@/utils/taskStatusUtils';

export const MyTasksWidget = () => {
  const { userProfile } = useAuth();
  const { tasks, isLoading, taskCounts } = useMyTasks();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-primary" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg">
                <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0 animate-pulse"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-primary" />
            My Tasks
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{taskCounts.total} total</span>
            {taskCounts.overdue > 0 && (
              <span className="flex items-center text-destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {taskCounts.overdue} overdue
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStatusColorClass(task.status, statusOptions).includes('bg-green') ? 'bg-green-500' : getStatusColorClass(task.status, statusOptions).includes('bg-blue') ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-sm truncate">
                      {task.task_number} - {task.title}
                    </p>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground flex items-center ml-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColorClass(task.priority, priorityOptions)}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(task.status, statusOptions)}`}>
                      {getStatusLabel(task.status, statusOptions)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks assigned to you</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};