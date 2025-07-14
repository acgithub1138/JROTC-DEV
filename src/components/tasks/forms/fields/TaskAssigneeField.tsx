
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { UseFormReturn } from 'react-hook-form';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { TaskFormData } from '../schemas/taskFormSchema';

interface TaskAssigneeFieldProps {
  form: UseFormReturn<TaskFormData>;
  canAssignTasks: boolean;
  canEditThisTask: boolean;
}

export const TaskAssigneeField: React.FC<TaskAssigneeFieldProps> = ({ form, canAssignTasks, canEditThisTask }) => {
  const { users, isLoading, error } = useSchoolUsers(true); // Only fetch active users
  
  if (!canEditThisTask) {
    return null;
  }

  const assignedUserId = form.watch('assigned_to');
  const assignedUser = users.find(user => user.id === assignedUserId);
  
  // If user can't assign tasks, don't show the field at all - it will be auto-assigned
  if (!canAssignTasks) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Assigned To *</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Assigned To *</Label>
        <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
          Error loading users
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="assigned_to">Assigned To *</Label>
      <Select value={form.watch('assigned_to')} onValueChange={(value) => form.setValue('assigned_to', value)}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading users..." : "Select assignee"} />
        </SelectTrigger>
        <SelectContent>
          {users
            .sort((a, b) => a.last_name.localeCompare(b.last_name))
            .map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.last_name}, {user.first_name} ({user.role})
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {form.formState.errors.assigned_to && (
        <p className="text-sm text-red-600">{form.formState.errors.assigned_to.message}</p>
      )}
    </div>
  );
};
