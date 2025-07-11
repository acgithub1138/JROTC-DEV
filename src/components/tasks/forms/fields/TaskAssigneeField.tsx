
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { TaskFormData } from '../schemas/taskFormSchema';

interface TaskAssigneeFieldProps {
  form: UseFormReturn<TaskFormData>;
  canAssignTasks: boolean;
  canEditThisTask: boolean;
}

export const TaskAssigneeField: React.FC<TaskAssigneeFieldProps> = ({ form, canAssignTasks, canEditThisTask }) => {
  const { users } = useSchoolUsers();
  
  if (!canEditThisTask) {
    return null;
  }

  const assignedUserId = form.watch('assigned_to');
  const assignedUser = users.find(user => user.id === assignedUserId);
  
  // If user can't assign tasks but can edit, show read-only assigned user
  if (!canAssignTasks) {
    return (
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Assigned To *</Label>
        <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
          {assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name} (${assignedUser.role})` : 'No assignee'}
        </div>
        {/* Hidden input to maintain form field value */}
        <input
          type="hidden"
          {...form.register('assigned_to')}
          value={assignedUserId || ''}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="assigned_to">Assigned To *</Label>
      <Select value={form.watch('assigned_to')} onValueChange={(value) => form.setValue('assigned_to', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select assignee" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.first_name} {user.last_name} ({user.role})
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
