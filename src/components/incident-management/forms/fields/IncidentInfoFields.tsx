import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IncidentInfoFieldsProps {
  form: UseFormReturn<any>;
  canAssignIncidents: boolean;
  categoryOptions: Array<{ value: string; label: string; }>;
}

export const IncidentInfoFields: React.FC<IncidentInfoFieldsProps> = ({
  form,
  canAssignIncidents,
  categoryOptions
}) => {
  return (
    <>
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem className="flex items-start gap-4">
            <FormLabel className="w-24 text-right flex-shrink-0 pt-2">
              Category <span className="text-destructive">*</span>
            </FormLabel>
            <div className="flex-1">
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.value && (
                <div className="text-sm text-muted-foreground mt-1">
                  {field.value === 'issue' && "Something is broken"}
                  {field.value === 'request' && "Ask a question"}
                  {field.value === 'enhancement' && "Request new functionality"}
                  {field.value === 'maintenance' && "System Update"}
                </div>
              )}
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem className="flex items-center gap-4">
            <FormLabel className="w-24 text-right flex-shrink-0">Status</FormLabel>
            <div className="flex-1">
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </>
  );
};