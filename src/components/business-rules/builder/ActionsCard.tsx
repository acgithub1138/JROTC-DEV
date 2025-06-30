
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchemaTracking } from '@/hooks/useSchemaTracking';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { DynamicFieldInput } from './DynamicFieldInput';

interface ActionsCardProps {
  actions: Array<{
    type: string;
    parameters: any;
  }>;
  onActionsChange: (actions: any[]) => void;
  triggerTable: string;
}

const actionTypes = [
  { value: 'update_record', label: 'Update Record' },
  { value: 'create_task_comment', label: 'Create Task Comment' },
  { value: 'assign_task', label: 'Assign Task' },
  { value: 'log_message', label: 'Log Message' }
];

export const ActionsCard: React.FC<ActionsCardProps> = ({
  actions,
  onActionsChange,
  triggerTable
}) => {
  const { users } = useSchoolUsers();
  const { getFieldsForTable } = useSchemaTracking();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();

  // Get dynamic fields for the selected table
  const availableFields = React.useMemo(() => {
    if (!triggerTable) return [];
    
    const fields = getFieldsForTable(triggerTable);
    
    // Filter out system fields that shouldn't be updated
    const systemFields = ['id', 'created_at', 'updated_at', 'school_id'];
    
    return fields.filter(field => 
      !systemFields.includes(field.column_name) &&
      field.is_active
    ).map(field => ({
      value: field.column_name,
      label: field.column_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      dataType: field.data_type,
      isNullable: field.is_nullable
    }));
  }, [triggerTable, getFieldsForTable]);

  const addAction = () => {
    const newAction = {
      type: '',
      parameters: {}
    };
    onActionsChange([...actions, newAction]);
  };

  const removeAction = (index: number) => {
    const updatedActions = actions.filter((_, i) => i !== index);
    onActionsChange(updatedActions);
  };

  const updateAction = (index: number, field: string, value: any) => {
    const updatedActions = [...actions];
    if (field === 'type') {
      updatedActions[index] = { type: value, parameters: {} };
    } else {
      updatedActions[index] = {
        ...updatedActions[index],
        parameters: {
          ...updatedActions[index].parameters,
          [field]: value
        }
      };
    }
    onActionsChange(updatedActions);
  };

  const renderActionParameters = (action: any, index: number) => {
    switch (action.type) {
      case 'update_record':
        if (triggerTable && availableFields.length > 0) {
          const selectedField = availableFields.find(f => f.value === action.parameters.field);
          
          return (
            <div className="space-y-3">
              <div>
                <Label>Field to Update</Label>
                <Select
                  value={action.parameters.field || ''}
                  onValueChange={(value) => {
                    // Clear the current value when field changes
                    updateAction(index, 'field', value);
                    updateAction(index, 'value', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedField && (
                <DynamicFieldInput
                  field={selectedField}
                  value={action.parameters.value || ''}
                  onChange={(value) => updateAction(index, 'value', value)}
                  triggerTable={triggerTable}
                  users={users}
                  statusOptions={statusOptions}
                  priorityOptions={priorityOptions}
                />
              )}
            </div>
          );
        }
        return (
          <div className="text-sm text-gray-500">
            Please select a trigger table first to see available fields.
          </div>
        );

      case 'create_task_comment':
        return (
          <div>
            <Label>Comment Text</Label>
            <Textarea
              placeholder="Enter comment text..."
              value={action.parameters.comment || ''}
              onChange={(e) => updateAction(index, 'comment', e.target.value)}
            />
          </div>
        );

      case 'assign_task':
        return (
          <div>
            <Label>Assign To</Label>
            <Select
              value={action.parameters.user_id || ''}
              onValueChange={(value) => updateAction(index, 'user_id', value)}
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
              value={action.parameters.message || ''}
              onChange={(e) => updateAction(index, 'message', e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions - "What to do"</CardTitle>
        <CardDescription>Define what actions to perform when conditions are met</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Action {index + 1}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAction(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div>
              <Label>Action Type</Label>
              <Select
                value={action.type}
                onValueChange={(value) => updateAction(index, 'type', value)}
              >
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
            
            {action.type && renderActionParameters(action, index)}
          </div>
        ))}
        
        <Button onClick={addAction} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </Button>
      </CardContent>
    </Card>
  );
};
