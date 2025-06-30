
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VariablesPanel } from './VariablesPanel';
import { TableColumn, EnhancedVariable } from '@/hooks/email/useTableColumns';

interface BodyFieldProps {
  value: string;
  onChange: (value: string) => void;
  columns: TableColumn[];
  enhancedVariables: EnhancedVariable[];
  onVariableInsert: (variableName: string) => void;
}

export const BodyField: React.FC<BodyFieldProps> = ({
  value,
  onChange,
  columns,
  enhancedVariables,
  onVariableInsert,
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2 space-y-2">
        <Label htmlFor="body">Email Body</Label>
        <Textarea
          id="body"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter email body (use {{variable}} for dynamic content)"
          rows={12}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Available Variables</Label>
        <VariablesPanel
          columns={columns}
          enhancedVariables={enhancedVariables}
          onVariableInsert={onVariableInsert}
        />
      </div>
    </div>
  );
};
