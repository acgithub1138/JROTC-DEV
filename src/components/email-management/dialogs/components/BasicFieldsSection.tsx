
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailRuleFormData } from './types';

interface BasicFieldsSectionProps {
  formData: EmailRuleFormData;
  availableTables: Array<{ name: string; label: string }>;
  onFormChange: (updates: Partial<EmailRuleFormData>) => void;
}

export const BasicFieldsSection: React.FC<BasicFieldsSectionProps> = ({
  formData,
  availableTables,
  onFormChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
          placeholder="Enter rule name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Source Table</Label>
        <Select
          value={formData.source_table}
          onValueChange={(value) => onFormChange({ source_table: value, template_id: '' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select source table" />
          </SelectTrigger>
          <SelectContent>
            {availableTables.map((table) => (
              <SelectItem key={table.name} value={table.name}>
                {table.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
