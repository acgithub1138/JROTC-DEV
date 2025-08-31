import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface IncidentDescriptionFieldProps {
  form: UseFormReturn<any>;
}

export const IncidentDescriptionField: React.FC<IncidentDescriptionFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter incident description"
              rows={4}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};