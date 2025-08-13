import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubtaskFormData } from '../schemas/subtaskFormSchema';

interface SubtaskTitleFieldProps {
  form: UseFormReturn<SubtaskFormData>;
}

export const SubtaskTitleField: React.FC<SubtaskTitleFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Subtask Title *</FormLabel>
          <FormControl>
            <Input placeholder="Enter subtask title" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};