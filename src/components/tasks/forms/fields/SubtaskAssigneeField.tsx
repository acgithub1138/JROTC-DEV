import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { SubtaskFormData } from '../schemas/subtaskFormSchema';

interface SubtaskAssigneeFieldProps {
  form: UseFormReturn<SubtaskFormData>;
  canAssignTasks: boolean;
  canEditThisTask: boolean;
}

export const SubtaskAssigneeField: React.FC<SubtaskAssigneeFieldProps> = ({ 
  form, 
  canAssignTasks, 
  canEditThisTask 
}) => {
  const { users } = useSchoolUsers(true);

  // Don't show assignee field if user can't assign tasks and can't edit this specific task
  if (!canAssignTasks && !canEditThisTask) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="assigned_to"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Assigned To</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
            disabled={!canAssignTasks && !canEditThisTask}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.last_name}, {user.first_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};