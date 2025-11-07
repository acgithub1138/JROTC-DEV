
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';

interface TaskDescriptionFieldProps {
  form: UseFormReturn<TaskFormData>;
}

export const TaskDescriptionField: React.FC<TaskDescriptionFieldProps> = ({ form }) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:gap-4">
        <Label htmlFor="description" className="sm:w-32 sm:text-right text-left sm:pt-2">Task Details *</Label>
        <div className="flex-1">
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Enter detailed description of the task"
            rows={4}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};
