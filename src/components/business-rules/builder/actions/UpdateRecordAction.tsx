
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicFieldInput } from '../DynamicFieldInput';

interface UpdateRecordActionProps {
  parameters: any;
  onParameterChange: (field: string, value: any) => void;
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

export const UpdateRecordAction: React.FC<UpdateRecordActionProps> = ({
  parameters,
  onParameterChange,
  triggerTable,
  availableFields,
  users,
  statusOptions,
  priorityOptions
}) => {
  console.log('UpdateRecordAction render:', { parameters, availableFields });
  
  if (!triggerTable || availableFields.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Please select a trigger table first to see available fields.
      </div>
    );
  }

  const selectedField = availableFields.find(f => f.value === parameters.field);

  const handleFieldChange = (fieldValue: string) => {
    console.log('Field changing from', parameters.field, 'to', fieldValue);
    
    // Only clear the value if we're changing to a completely different field type
    const currentField = availableFields.find(f => f.value === parameters.field);
    const newField = availableFields.find(f => f.value === fieldValue);
    
    const shouldClearValue = currentField && newField && 
      currentField.dataType !== newField.dataType;
    
    onParameterChange('field', fieldValue);
    
    if (shouldClearValue) {
      console.log('Clearing value due to field type change');
      onParameterChange('value', '');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Field to Update</Label>
        <Select
          value={parameters.field || ''}
          onValueChange={handleFieldChange}
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
          value={parameters.value || ''}
          onChange={(value) => onParameterChange('value', value)}
          triggerTable={triggerTable}
          users={users}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
        />
      )}
    </div>
  );
};
