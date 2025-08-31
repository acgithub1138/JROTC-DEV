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
          <FormItem>
            <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
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
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
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
          </FormItem>
        )}
      />
    </>
  );
};