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
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="first_name"
        render={({ field }) => (
          <FormItem className="flex items-center gap-4">
            <FormLabel className="w-32 text-right flex-shrink-0">
              First Name <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex-1">
              <FormControl>
                <Input 
                  placeholder="Enter first name" 
                  {...field} 
                  disabled={mode === 'edit'} // Disable editing names in edit mode
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="last_name"
        render={({ field }) => (
          <FormItem className="flex items-center gap-4">
            <FormLabel className="w-32 text-right flex-shrink-0">
              Last Name <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex-1">
              <FormControl>
                <Input 
                  placeholder="Enter last name" 
                  {...field} 
                  disabled={mode === 'edit'} // Disable editing names in edit mode
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem className="flex items-center gap-4">
            <FormLabel className="w-32 text-right flex-shrink-0">
              Email <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex-1">
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="Enter email address" 
                  {...field} 
                  disabled={mode === 'edit'} // Disable editing email in edit mode
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};