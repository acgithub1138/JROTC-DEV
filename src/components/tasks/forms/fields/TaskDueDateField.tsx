
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
  );
};
