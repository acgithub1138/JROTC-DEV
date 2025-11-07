import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/tasks/types';
import { format } from 'date-fns';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

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
  const { users, isLoading: isLoadingUsers, error: usersError } = useSchoolUsers(true);
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
        <Label htmlFor="priority" className="sm:w-24 sm:text-right text-left">Priority</Label>
        <Select value={form.watch('priority')} onValueChange={(value) => form.setValue('priority', value)}>
          <SelectTrigger className="flex-1">
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

      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
        <Label htmlFor="status" className="sm:w-24 sm:text-right text-left">Status</Label>
        <Select 
          value={form.watch('status')} 
          onValueChange={(value) => form.setValue('status', value)}
          disabled={!canEditThisTask}
        >
          <SelectTrigger className="flex-1">
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

      {(canEditThisTask && canAssignTasks) && (
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
          <Label htmlFor="assigned_to" className="sm:w-24 sm:text-right text-left">Assigned To *</Label>
          <div className="flex-1">
            {isLoadingUsers ? (
              <div className="text-sm text-muted-foreground">Loading users...</div>
            ) : usersError ? (
              <div className="text-sm text-red-600">Error loading users</div>
            ) : (
              <Select 
                value={form.watch('assigned_to') || ''} 
                onValueChange={(value) => form.setValue('assigned_to', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .sort((a, b) => {
                      const aName = `${a.last_name}, ${a.first_name}`;
                      const bName = `${b.last_name}, ${b.first_name}`;
                      return aName.localeCompare(bName);
                    })
                    .map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.last_name}, {user.first_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
              )}
            {form.formState.errors.assigned_to && (
              <p className="text-sm text-red-600">{form.formState.errors.assigned_to.message}</p>
            )}
          </div>
        </div>
      )}

      <FormField
        control={form.control}
        name="due_date"
        render={({ field }) => (
          <FormItem>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
              <FormLabel className="sm:w-24 sm:text-right text-left">Due Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      // Create date object from input value with validation
                      const date = new Date(dateValue + 'T12:00:00');
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
                  className="flex-1"
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};