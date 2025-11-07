import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Clock, User, Calendar } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { getStatusColorClass, getPriorityColorClass, getStatusLabel } from '@/utils/taskStatusUtils';

interface TaskCardsProps {
  tasks: (Task | Subtask)[];
  onView: (task: Task | Subtask) => void;
  onEdit: (task: Task | Subtask) => void;
  onDelete: (task: Task | Subtask) => void;
  isMobile?: boolean;
  isNative?: boolean;
}

export const TaskCards: React.FC<TaskCardsProps> = ({ 
  tasks, 
  onView, 
  onEdit, 
  onDelete,
  isMobile,
  isNative 
}) => {
  // Determine if we should use mobile layout
  const shouldUseMobileLayout = isNative || isMobile;
  
  console.log('TaskCards component rendered:', { 
    tasksLength: tasks.length, 
    isMobile,
    isNative,
    shouldUseMobileLayout,
    windowWidth: window.innerWidth,
    tasksData: tasks.slice(0, 3).map(t => ({ 
      id: t.id, 
      title: t.title, 
      task_number: t.task_number 
    })),
    onView: typeof onView,
    onEdit: typeof onEdit,
    onDelete: typeof onDelete
  });
  
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  if (tasks.length === 0) {
    console.log('TaskCards: No tasks to display');
    return (
      <div className="text-center py-8 text-gray-500">
        No tasks found
      </div>
    );
  }
  
  console.log('TaskCards: About to render grid with', tasks.length, 'tasks');

  // Use conditional grid classes based on mobile detection
  const gridClasses = shouldUseMobileLayout 
    ? "grid gap-4 grid-cols-1" 
    : "grid gap-4 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={gridClasses}>
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {'parent_task_id' in task && <span className="text-xs text-muted-foreground mr-2">SUBTASK:</span>}
                  {task.title}
                </CardTitle>
                <p 
                  className="text-sm text-muted-foreground cursor-pointer hover:text-primary" 
                  onClick={() => onView(task)}
                >
                  {task.task_number}
                </p>
              </div>
              <div className="flex space-x-1">
                <Badge className={getPriorityColorClass(task.priority, priorityOptions)}>
                  {task.priority}
                </Badge>
                <Badge className={getStatusColorClass(task.status, statusOptions)}>
                  {getStatusLabel(task.status, statusOptions)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="space-y-2 mb-4">
              {task.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Due: {formatDate(task.due_date)}</span>
                </div>
                
                {task.assigned_to_profile && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>
                      {task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(task)}
                className="w-full"
              >
                <Eye className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">View</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
                className="w-full"
              >
                <Edit className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(task)}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};