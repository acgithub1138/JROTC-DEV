
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VariableButton } from './VariableButton';
import { TableColumn, EnhancedVariable } from '@/hooks/email/useTableColumns';

interface VariablesPanelProps {
  columns: TableColumn[];
  enhancedVariables: EnhancedVariable[];
  onVariableInsert: (variableName: string) => void;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  columns,
  enhancedVariables,
  onVariableInsert,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Table Columns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {columns.map((column) => (
          <VariableButton
            key={column.column_name}
            label={column.display_label}
            variableName={column.column_name}
            dataType={column.data_type}
            onClick={onVariableInsert}
          />
        ))}
        
        {enhancedVariables.length > 0 && (
          <>
            <Separator />
            <div className="text-xs font-medium text-gray-600 px-1">Profile References</div>
            {enhancedVariables.map((variable) => (
              <VariableButton
                key={variable.variable}
                label={variable.label}
                variableName={variable.variable}
                isProfileReference={true}
                onClick={onVariableInsert}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};
