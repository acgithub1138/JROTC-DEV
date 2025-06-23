
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit, Check, X } from 'lucide-react';
import { EditState } from '../types/TaskDetailTypes';

interface TaskDescriptionCardProps {
  task: any;
  canEdit: boolean;
  editState: EditState;
  onStartEdit: (field: string, currentValue: any) => void;
  onCancelEdit: () => void;
  onSaveEdit: (field: string) => void;
  onEditStateChange: (editState: EditState) => void;
}

export const TaskDescriptionCard: React.FC<TaskDescriptionCardProps> = ({
  task,
  canEdit,
  editState,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditStateChange
}) => {
  const isEditing = editState.field === 'description';

  const renderDescription = () => {
    if (!canEdit) {
      return <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description || 'No description'}</p>;
    }

    if (isEditing) {
      return (
        <div className="space-y-2">
          <Textarea
            value={editState.value || ''}
            onChange={(e) => onEditStateChange({ ...editState, value: e.target.value })}
            rows={4}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSaveEdit('description')}>
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-50 rounded p-2 -mx-2 -my-2 group"
        onClick={() => onStartEdit('description', task.description)}
      >
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {task.description || 'Click to add description...'}
        </p>
        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 mt-1" />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Description</CardTitle>
      </CardHeader>
      <CardContent>
        {renderDescription()}
      </CardContent>
    </Card>
  );
};
