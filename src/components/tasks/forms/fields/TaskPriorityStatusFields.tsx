
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/tasks/types';

interface TaskPriorityStatusFieldsProps {
  form: UseFormReturn<TaskFormData>;
  canAssignTasks: boolean;
  isEditingAssignedTask: boolean;
  statusOptions: TaskStatusOption[];
  priorityOptions: TaskPriorityOption[];
}

export const TaskPriorityStatusFields: React.FC<TaskPriorityStatusFieldsProps> = ({ 
  form, 
  canAssignTasks, 
  isEditingAssignedTask,
  statusOptions,
  priorityOptions
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select value={form.watch('priority')} onValueChange={(value) => form.setValue('priority', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions
              .filter(priority => priority.is_active)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select 
          value={form.watch('status')} 
          onValueChange={(value) => form.setValue('status', value)}
          disabled={!canAssignTasks && !isEditingAssignedTask}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions
              .filter(status => status.is_active)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
