
import React from 'react';
import { Task } from '@/hooks/useTasks';
import { TaskDetailDialog } from './TaskDetailDialog';

interface TaskDetailProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = (props) => {
  return <TaskDetailDialog {...props} />;
};
