import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';

interface IncidentDescriptionFieldProps {
  form: UseFormReturn<any>;
}

export const IncidentDescriptionField: React.FC<IncidentDescriptionFieldProps> = ({ form }) => {
  const isMobile = useIsMobile();
  
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem className={`flex ${isMobile ? 'flex-col' : 'items-start'} gap-${isMobile ? '2' : '4'}`}>
          <FormLabel className={isMobile ? '' : 'w-32 text-right flex-shrink-0 pt-2'}>
            Details <span className="text-destructive">*</span>
          </FormLabel>
          <div className="flex-1">
            <FormControl>
              <Textarea
                placeholder="Enter incident description"
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
};