
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { TaskFormData } from '../schemas/taskFormSchema';

interface TaskAssigneeFieldProps {
  form: UseFormReturn<TaskFormData>;
  canAssignTasks: boolean;
}

export const TaskAssigneeField: React.FC<TaskAssigneeFieldProps> = ({ form, canAssignTasks }) => {
  const { users } = useSchoolUsers();

  if (!canAssignTasks) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="assigned_to">Assigned To</Label>
      <Select value={form.watch('assigned_to')} onValueChange={(value) => form.setValue('assigned_to', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select assignee (optional)" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.first_name} {user.last_name} ({user.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
