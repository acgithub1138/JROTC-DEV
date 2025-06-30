
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VariablesPanel } from './VariablesPanel';
import { useTableColumns } from '@/hooks/email/useTableColumns';
import { RecipientConfig } from './types';

interface RecipientConfigSectionProps {
  recipientConfig: RecipientConfig;
  sourceTable: string;
  onRecipientConfigChange: (updates: Partial<RecipientConfig>) => void;
}

export const RecipientConfigSection: React.FC<RecipientConfigSectionProps> = ({
  recipientConfig,
  sourceTable,
  onRecipientConfigChange,
}) => {
  const { data: columns = [] } = useTableColumns(sourceTable);

  const handleVariableInsert = (variableName: string) => {
    onRecipientConfigChange({ recipient_field: variableName });
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recipient Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Type</Label>
              <Select
                value={recipientConfig.recipient_type}
                onValueChange={(value) => onRecipientConfigChange({ recipient_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field">From Record Field</SelectItem>
                  <SelectItem value="static">Static Email Address</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientConfig.recipient_type === 'field' ? (
              <div className="space-y-2">
                <Label htmlFor="recipient_field">Recipient Field</Label>
                <Input
                  id="recipient_field"
                  value={recipientConfig.recipient_field}
                  onChange={(e) => onRecipientConfigChange({ recipient_field: e.target.value })}
                  placeholder="e.g., email, assigned_to.email"
                />
                <p className="text-xs text-muted-foreground">
                  Use the same format as template variables (e.g., assigned_to.email)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="static_email">Static Email Address</Label>
                <Input
                  id="static_email"
                  type="email"
                  value={recipientConfig.static_email}
                  onChange={(e) => onRecipientConfigChange({ static_email: e.target.value })}
                  placeholder="recipient@example.com"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {recipientConfig.recipient_type === 'field' && sourceTable && (
        <div className="space-y-2">
          <VariablesPanel
            columns={columns}
            onVariableInsert={handleVariableInsert}
          />
        </div>
      )}
    </div>
  );
};
