import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/tasks/types';
import { format } from 'date-fns';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface TaskPriorityStatusDueDateFieldsProps {
  form: UseFormReturn<TaskFormData>;
  canAssignTasks: boolean;
  canEditThisTask: boolean;
  isEditingAssignedTask: boolean;
  statusOptions: TaskStatusOption[];
  priorityOptions: TaskPriorityOption[];
}

export const TaskPriorityStatusDueDateFields: React.FC<TaskPriorityStatusDueDateFieldsProps> = ({ 
  form, 
  canAssignTasks, 
  canEditThisTask,
  isEditingAssignedTask,
  statusOptions,
  priorityOptions
}) => {
  return (
    <div className="space-y-4">
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
          disabled={!canEditThisTask}
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

      <FormField
        control={form.control}
        name="due_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Due Date</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  if (dateValue) {
                    // Create date object from input value with validation
                    const date = new Date(dateValue + 'T00:00:00');
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    
                    if (date >= tomorrow) {
                      field.onChange(date);
                    }
                  } else {
                    field.onChange(undefined);
                  }
                }}
                min={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return format(tomorrow, 'yyyy-MM-dd');
                })()}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};