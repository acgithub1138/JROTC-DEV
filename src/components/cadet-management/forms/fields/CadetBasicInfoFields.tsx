import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { CadetFormData } from '../schemas/cadetFormSchema';

interface CadetBasicInfoFieldsProps {
  form: UseFormReturn<CadetFormData>;
  mode: 'create' | 'edit';
}

export const CadetBasicInfoFields: React.FC<CadetBasicInfoFieldsProps> = ({
  form,
  mode
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="first_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter first name" 
                {...field} 
                disabled={mode === 'edit'} // Disable editing names in edit mode
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="last_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter last name" 
                {...field} 
                disabled={mode === 'edit'} // Disable editing names in edit mode
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input 
                type="email" 
                placeholder="Enter email address" 
                {...field} 
                disabled={mode === 'edit'} // Disable editing email in edit mode
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};