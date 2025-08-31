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
        <FormItem className="flex items-center gap-4">
          <FormLabel className="w-32 text-right flex-shrink-0">
            Title <span className="text-destructive">*</span>
          </FormLabel>
          <div className="flex-1">
            <FormControl>
              <Input placeholder="Enter incident title" {...field} />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
};