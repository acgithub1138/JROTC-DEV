
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { VariableButton } from './VariableButton';
import { TableColumn, EnhancedVariable } from '@/hooks/email/useTableColumns';

interface SubjectFieldProps {
  value: string;
  onChange: (value: string) => void;
  columns: TableColumn[];
  enhancedVariables: EnhancedVariable[];
  onVariableInsert: (variableName: string) => void;
}

export const SubjectField: React.FC<SubjectFieldProps> = ({
  value,
  onChange,
  columns,
  enhancedVariables,
  onVariableInsert,
}) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-2 space-y-2">
        <Label htmlFor="subject">Email Subject</Label>
        <Input
          id="subject"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter email subject (use {{variable}} for dynamic content)"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Subject Variables</Label>
        <Card className="h-32">
          <CardContent className="p-2 overflow-y-auto">
            <div className="space-y-1">
              {columns.map((column) => (
                <VariableButton
                  key={`subject-${column.column_name}`}
                  label={column.display_label}
                  variableName={column.column_name}
                  onClick={onVariableInsert}
                  className="h-7"
                />
              ))}
              {enhancedVariables.map((variable) => (
                <VariableButton
                  key={`subject-${variable.variable}`}
                  label={variable.label}
                  variableName={variable.variable}
                  isProfileReference={true}
                  onClick={onVariableInsert}
                  className="h-7"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
