
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/config/taskOptions';

interface TaskPriorityStatusFieldsProps {
  form: UseFormReturn<TaskFormData>;
  canAssignTasks: boolean;
  isEditingAssignedTask: boolean;
}

export const TaskPriorityStatusFields: React.FC<TaskPriorityStatusFieldsProps> = ({ 
  form, 
  canAssignTasks, 
  isEditingAssignedTask 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select value={form.watch('priority')} onValueChange={(value) => form.setValue('priority', value as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TASK_PRIORITY_CONFIG)
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
          onValueChange={(value) => form.setValue('status', value as any)}
          disabled={!canAssignTasks && !isEditingAssignedTask}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TASK_STATUS_CONFIG)
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
