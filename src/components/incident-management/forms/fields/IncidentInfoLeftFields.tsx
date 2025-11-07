import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import type { Incident } from '@/hooks/incidents/types';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  return (
    <>
      {/* Incident Number - Read only field */}
      <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-${isMobile ? '2' : '4'}`}>
        <Label className={isMobile ? '' : 'w-24 text-right'}>Number</Label>
        <Input value={mode === 'create' ? 'Next #' : incident?.incident_number || ''} disabled className="bg-muted flex-1" />
      </div>

      {/* Created By - Read only field */}
      <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-${isMobile ? '2' : '4'}`}>
        <Label className={isMobile ? '' : 'w-24 text-right'}>Created by</Label>
        <Input 
          value={mode === 'create' 
            ? (userProfile ? `${userProfile.last_name}, ${userProfile.first_name}` : 'Current User')
            : ((incident as any)?.created_by_profile 
                ? `${(incident as any).created_by_profile.last_name}, ${(incident as any).created_by_profile.first_name}` 
                : 'Unknown')
          } 
          disabled 
          className="bg-muted flex-1" 
        />
      </div>

      {/* Created Date - Read only field */}
      <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-${isMobile ? '2' : '4'}`}>
        <Label className={isMobile ? '' : 'w-24 text-right'}>Created</Label>
        <Input 
          value={mode === 'create' 
            ? format(new Date(), "MM/dd/yyyy HH:mm")
            : (incident?.created_at ? format(new Date(incident.created_at), "MM/dd/yyyy HH:mm") : '')
          }
          disabled 
          className="bg-muted flex-1" 
        />
      </div>

      {/* Category */}
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem className={`flex ${isMobile ? 'flex-col' : 'items-start'} gap-${isMobile ? '2' : '4'}`}>
            <FormLabel className={isMobile ? '' : 'w-24 text-right flex-shrink-0 pt-2'}>
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