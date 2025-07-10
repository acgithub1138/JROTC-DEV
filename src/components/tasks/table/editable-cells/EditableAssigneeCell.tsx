import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

interface EditableAssigneeCellProps {
  value: string | null;
  users: User[];
  onValueChange: (value: string | null) => void;
}

export const EditableAssigneeCell: React.FC<EditableAssigneeCellProps> = ({
  value,
  users,
  onValueChange,
}) => {
  const handleValueChange = (newValue: string) => {
    const actualValue = newValue === 'unassigned' ? null : newValue;
    console.log('Assigned to changed:', newValue, '-> actualValue:', actualValue);
    onValueChange(actualValue);
  };

  return (
    <Select
      value={value || 'unassigned'}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="h-8">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {users
          .sort((a, b) => a.last_name.localeCompare(b.last_name))
          .map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.last_name}, {user.first_name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};