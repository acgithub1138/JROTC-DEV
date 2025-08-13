import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubtaskFormData } from '../schemas/subtaskFormSchema';

interface SubtaskPriorityStatusFieldsProps {
  form: UseFormReturn<SubtaskFormData>;
  canAssignTasks: boolean;
  canEditThisTask: boolean;
  isEditingAssignedTask: boolean;
  statusOptions: Array<{ value: string; label: string }>;
  priorityOptions: Array<{ value: string; label: string }>;
}

export const SubtaskPriorityStatusFields: React.FC<SubtaskPriorityStatusFieldsProps> = ({ 
  form, 
  canAssignTasks, 
  canEditThisTask, 
  isEditingAssignedTask,
  statusOptions, 
  priorityOptions 
}) => {
  // Users can edit priority if they can assign tasks or are editing their own assigned task
  const canEditPriority = canAssignTasks || canEditThisTask;
  
  // Users can edit status if they can assign tasks or are editing their own assigned task
  const canEditStatus = canAssignTasks || isEditingAssignedTask;

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Priority</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={!canEditPriority}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={!canEditStatus}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};