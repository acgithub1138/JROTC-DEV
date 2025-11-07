import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';

interface IncidentTitleFieldProps {
  form: UseFormReturn<any>;
}

export const IncidentTitleField: React.FC<IncidentTitleFieldProps> = ({ form }) => {
  const isMobile = useIsMobile();
  
  return (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-${isMobile ? '2' : '4'}`}>
          <FormLabel className={isMobile ? '' : 'w-32 text-right flex-shrink-0'}>
            Short Description <span className="text-destructive">*</span>
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