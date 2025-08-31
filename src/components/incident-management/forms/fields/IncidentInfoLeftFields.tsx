import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import type { Incident } from '@/hooks/incidents/types';

interface IncidentInfoLeftFieldsProps {
  form: UseFormReturn<any>;
  mode: 'create' | 'edit';
  incident?: Incident;
  categoryOptions: Array<{ value: string; label: string; }>;
}

export const IncidentInfoLeftFields: React.FC<IncidentInfoLeftFieldsProps> = ({
  form,
  mode,
  incident,
  categoryOptions
}) => {
  const { userProfile } = useAuth();

  return (
    <>
      {/* Incident Number - Read only field */}
      <div className="flex items-center gap-4">
        <label className="w-32 text-right flex-shrink-0 text-sm font-medium">
          Number
        </label>
        <div className="flex-1 text-sm text-muted-foreground">
          {mode === 'create' ? 'Auto-generated' : incident?.incident_number || 'N/A'}
        </div>
      </div>

      {/* Created By - Read only field */}
      <div className="flex items-center gap-4">
        <label className="w-32 text-right flex-shrink-0 text-sm font-medium">
          Created By
        </label>
        <div className="flex-1 text-sm text-muted-foreground">
          {mode === 'create' 
            ? (userProfile ? `${userProfile.last_name}, ${userProfile.first_name}` : 'Current User')
            : ((incident as any)?.created_by_profile 
                ? `${(incident as any).created_by_profile.last_name}, ${(incident as any).created_by_profile.first_name}` 
                : 'Unknown')
          }
        </div>
      </div>

      {/* Created Date - Read only field */}
      <div className="flex items-center gap-4">
        <label className="w-32 text-right flex-shrink-0 text-sm font-medium">
          Created
        </label>
        <div className="flex-1 text-sm text-muted-foreground">
          {mode === 'create' 
            ? format(new Date(), "MMM d, yyyy")
            : (incident?.created_at ? format(new Date(incident.created_at), "MMM d, yyyy") : 'N/A')
          }
        </div>
      </div>

      {/* Category */}
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem className="flex items-start gap-4">
            <FormLabel className="w-32 text-right flex-shrink-0 pt-2">
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
    </>
  );
};