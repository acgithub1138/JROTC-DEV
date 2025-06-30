
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActionTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const actionTypes = [
  { value: 'update_record', label: 'Update Record' },
  { value: 'create_task_comment', label: 'Create Task Comment' },
  { value: 'assign_task', label: 'Assign Task' },
  { value: 'log_message', label: 'Log Message' }
];

export const ActionTypeSelector: React.FC<ActionTypeSelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <div>
      <Label>Action Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select action type" />
        </SelectTrigger>
        <SelectContent>
          {actionTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
