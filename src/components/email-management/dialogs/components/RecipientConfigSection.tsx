
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecipientConfig } from './types';

interface RecipientConfigSectionProps {
  recipientConfig: RecipientConfig;
  onRecipientConfigChange: (updates: Partial<RecipientConfig>) => void;
}

export const RecipientConfigSection: React.FC<RecipientConfigSectionProps> = ({
  recipientConfig,
  onRecipientConfigChange,
}) => {
  return (
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
            <Label htmlFor="recipient_field">Email Field Name</Label>
            <Input
              id="recipient_field"
              value={recipientConfig.recipient_field}
              onChange={(e) => onRecipientConfigChange({ recipient_field: e.target.value })}
              placeholder="e.g., email, assigned_to.email"
            />
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
  );
};
