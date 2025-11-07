
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';

interface TaskTitleFieldProps {
  form: UseFormReturn<TaskFormData>;
}

export const TaskTitleField: React.FC<TaskTitleFieldProps> = ({ form }) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
        <Label htmlFor="title" className="sm:w-32 sm:text-right text-left">Short Description *</Label>
        <div className="flex-1">
          <Input
            id="title"
            {...form.register('title')}
            placeholder="Enter short description (max 150 characters)"
            maxLength={150}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};
