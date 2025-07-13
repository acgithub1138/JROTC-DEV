
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VariableButton } from './VariableButton';
import { ExpandableVariableButton } from './ExpandableVariableButton';
import { TableColumn } from '@/hooks/email/useTableColumns';
import { useRelatedTableFields } from '@/hooks/email/useRelatedTableFields';

interface VariablesPanelProps {
  columns: TableColumn[];
  enhancedVariables?: Array<{ variable: string; label: string; type: string }>;
  onVariableInsert: (variableName: string) => void;
}

const VariableWithRelatedFields: React.FC<{
  column: TableColumn;
  onVariableInsert: (variableName: string) => void;
}> = ({ column, onVariableInsert }) => {
  const { data: relatedFields = [] } = useRelatedTableFields(
    column.column_name,
    column.data_type === 'uuid'
  );

  if (column.data_type === 'uuid' && relatedFields.length > 0) {
    return (
      <ExpandableVariableButton
        label={column.display_label}
        variableName={column.column_name}
        dataType={column.data_type}
        relatedFields={relatedFields}
        onClick={onVariableInsert}
      />
    );
  }

  return (
    <VariableButton
      label={column.display_label}
      variableName={column.column_name}
      dataType={column.data_type}
      onClick={onVariableInsert}
    />
  );
};

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  columns,
  enhancedVariables = [],
  onVariableInsert,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Available Variables</CardTitle>
        <p className="text-xs text-gray-500">Click to insert at cursor position</p>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {columns.map((column) => (
          <VariableWithRelatedFields
            key={column.column_name}
            column={column}
            onVariableInsert={onVariableInsert}
          />
        ))}
        
        {enhancedVariables.length > 0 && (
          <>
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-gray-500 mb-2">Enhanced Variables</p>
            </div>
            {enhancedVariables.map((variable) => (
              <VariableButton
                key={variable.variable}
                label={variable.label}
                variableName={variable.variable}
                dataType="text"
                onClick={onVariableInsert}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};
