
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ActionTypeSelector } from './ActionTypeSelector';
import { UpdateRecordAction } from './UpdateRecordAction';
import { SimpleActions } from './SimpleActions';

interface ActionItemProps {
  action: { type: string; parameters: any };
  index: number;
  onRemove: () => void;
  onUpdate: (field: string, value: any) => void;
  triggerTable: string;
  availableFields: Array<{
    value: string;
    label: string;
    dataType: string;
    isNullable: boolean;
  }>;
  users: Array<{ id: string; first_name: string; last_name: string; }>;
  statusOptions: Array<{ value: string; label: string; }>;
  priorityOptions: Array<{ value: string; label: string; }>;
}

export const ActionItem: React.FC<ActionItemProps> = ({
  action,
  index,
  onRemove,
  onUpdate,
  triggerTable,
  availableFields,
  users,
  statusOptions,
  priorityOptions
}) => {
  const handleParameterChange = (field: string, value: any) => {
    // Pass individual parameter updates instead of the entire parameters object
    onUpdate('parameters', { [field]: value });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Action {index + 1}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <ActionTypeSelector
        value={action.type}
        onChange={(value) => onUpdate('type', value)}
      />
      
      {action.type === 'update_record' && (
        <UpdateRecordAction
          parameters={action.parameters}
          onParameterChange={handleParameterChange}
          triggerTable={triggerTable}
          availableFields={availableFields}
          users={users}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
        />
      )}
      
      {['create_task_comment', 'assign_task', 'log_message'].includes(action.type) && (
        <SimpleActions
          actionType={action.type}
          parameters={action.parameters}
          onParameterChange={handleParameterChange}
          users={users}
        />
      )}
    </div>
  );
};
