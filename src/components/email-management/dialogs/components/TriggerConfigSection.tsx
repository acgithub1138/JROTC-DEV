
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailRuleFormData } from './types';

interface TriggerConfigSectionProps {
  formData: EmailRuleFormData;
  availableTemplates: Array<{ id: string; name: string }>;
  onFormChange: (updates: Partial<EmailRuleFormData>) => void;
}

export const TriggerConfigSection: React.FC<TriggerConfigSectionProps> = ({
  formData,
  availableTemplates,
  onFormChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Trigger Event</Label>
        <Select
          value={formData.trigger_event}
          onValueChange={(value) => onFormChange({ trigger_event: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INSERT">Insert (New Record)</SelectItem>
            <SelectItem value="UPDATE">Update (Record Changed)</SelectItem>
            <SelectItem value="DELETE">Delete (Record Removed)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Email Template</Label>
        <Select
          value={formData.template_id}
          onValueChange={(value) => onFormChange({ template_id: value })}
          disabled={!formData.source_table}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            {availableTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
