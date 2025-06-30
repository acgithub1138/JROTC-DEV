
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SimpleActionsProps {
  actionType: string;
  parameters: any;
  onParameterChange: (field: string, value: any) => void;
  users: Array<{ id: string; first_name: string; last_name: string; }>;
}

export const SimpleActions: React.FC<SimpleActionsProps> = ({
  actionType,
  parameters,
  onParameterChange,
  users
}) => {
  switch (actionType) {
    case 'create_task_comment':
      return (
        <div>
          <Label>Comment Text</Label>
          <Textarea
            placeholder="Enter comment text..."
            value={parameters.comment || ''}
            onChange={(e) => onParameterChange('comment', e.target.value)}
          />
        </div>
      );

    case 'assign_task':
      return (
        <div>
          <Label>Assign To</Label>
          <Select
            value={parameters.user_id || ''}
            onValueChange={(value) => onParameterChange('user_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'log_message':
      return (
        <div>
          <Label>Log Message</Label>
          <Input
            placeholder="Enter log message..."
            value={parameters.message || ''}
            onChange={(e) => onParameterChange('message', e.target.value)}
          />
        </div>
      );

    default:
      return null;
  }
};
