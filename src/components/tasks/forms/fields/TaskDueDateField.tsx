import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface TaskDueDateFieldProps {
  form: UseFormReturn<any>;
}

export const TaskDueDateField: React.FC<TaskDueDateFieldProps> = ({ form }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = format(tomorrow, 'yyyy-MM-dd');

  return (
    <FormField
      control={form.control}
      name="due_date"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Due Date</FormLabel>
          <FormControl>
            <Input
              type="date"
              min={minDate}
              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const dateValue = e.target.value;
                if (dateValue) {
                  const date = new Date(dateValue + 'T00:00:00');
                  field.onChange(date);
                } else {
                  field.onChange(undefined);
                }
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};