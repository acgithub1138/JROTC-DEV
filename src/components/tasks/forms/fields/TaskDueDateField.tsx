
import React from 'react';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';
import { format } from 'date-fns';

interface TaskDueDateFieldProps {
  form: UseFormReturn<TaskFormData>;
}

export const TaskDueDateField: React.FC<TaskDueDateFieldProps> = ({ form }) => {
  return (
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
                field.onChange(dateValue ? new Date(dateValue) : null);
              }}
              className="w-full"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
