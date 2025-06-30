
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchemaTracking } from '@/hooks/useSchemaTracking';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useAuth } from '@/contexts/AuthContext';
import { ActionItem } from './actions/ActionItem';

interface ActionsCardProps {
  actions: Array<{
    type: string;
    parameters: any;
  }>;
  onActionsChange: (actions: any[]) => void;
  triggerTable: string;
}

export const ActionsCard: React.FC<ActionsCardProps> = ({
  actions,
  onActionsChange,
  triggerTable
}) => {
  const { userProfile } = useAuth();
  const { users } = useSchoolUsers();
  const { getFieldsForTable } = useSchemaTracking();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();

  // Get dynamic fields for the selected table
  const availableFields = React.useMemo(() => {
    if (!triggerTable || !userProfile?.school_id) return [];
    
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
  }, [triggerTable, getFieldsForTable, userProfile?.school_id]);

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
      // Preserve existing parameters if they're compatible with the new action type
      const existingParams = updatedActions[index].parameters || {};
      let newParams = {};
      
      // For update_record action, preserve field/value if they exist and are valid
      if (value === 'update_record') {
        if (existingParams.field && availableFields.some(f => f.value === existingParams.field)) {
          newParams = {
            field: existingParams.field,
            value: existingParams.value || ''
          };
        }
      }
      
      updatedActions[index] = { 
        type: value, 
        parameters: newParams 
      };
    } else if (field === 'parameters') {
      // Handle parameter updates
      updatedActions[index] = {
        ...updatedActions[index],
        parameters: {
          ...updatedActions[index].parameters,
          ...value
        }
      };
    } else {
      updatedActions[index] = {
        ...updatedActions[index],
        [field]: value
      };
    }
    onActionsChange(updatedActions);
  };

  if (!userProfile?.school_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actions - "What to do"</CardTitle>
          <CardDescription>Authentication required to configure actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Please ensure you are properly authenticated to configure business rule actions.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions - "What to do"</CardTitle>
        <CardDescription>Define what actions to perform when conditions are met</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          <ActionItem
            key={index}
            action={action}
            index={index}
            onRemove={() => removeAction(index)}
            onUpdate={(field, value) => updateAction(index, field, value)}
            triggerTable={triggerTable}
            availableFields={availableFields}
            users={users}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
          />
        ))}
        
        <Button onClick={addAction} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </Button>
      </CardContent>
    </Card>
  );
};
