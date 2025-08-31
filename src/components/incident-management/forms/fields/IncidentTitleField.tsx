import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface IncidentTitleFieldProps {
  form: UseFormReturn<any>;
}

export const IncidentTitleField: React.FC<IncidentTitleFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
          <FormControl>
            <Input placeholder="Enter incident title" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};