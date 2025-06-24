
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';

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
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
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
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="working_on_it">Working On It</SelectItem>
            <SelectItem value="stuck">Stuck</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
