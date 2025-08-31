import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

interface TaskAssigneeFieldProps {
  form: UseFormReturn<any>;
  canAssignTasks?: boolean;
  canEditThisTask?: boolean;
}

export const TaskAssigneeField: React.FC<TaskAssigneeFieldProps> = ({ 
  form, 
  canAssignTasks = true, 
  canEditThisTask = true 
}) => {
  const { users, isLoading } = useSchoolUsers(true); // Only active users

  return (
    <FormField
      control={form.control}
      name="assigned_to"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Assigned To</FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || !canAssignTasks || !canEditThisTask}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users
                .sort((a, b) => a.last_name.localeCompare(b.last_name))
                .map((user) => (
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