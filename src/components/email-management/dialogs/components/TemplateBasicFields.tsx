import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface TemplateBasicFieldsProps {
  formData: {
    name: string;
    source_table: string;
    recipient_field: string;
    is_active: boolean;
  };
  onFormChange: (updates: any) => void;
  availableTables: Array<{ name: string; label: string }>;
}

export const TemplateBasicFields: React.FC<TemplateBasicFieldsProps> = ({
  formData,
  onFormChange,
  availableTables,
}) => {
  // Get available recipient fields based on selected source table
  const getRecipientOptions = () => {
    if (!formData.source_table) return [];
    
    switch (formData.source_table) {
      case 'tasks':
      case 'subtasks':
        return [
          { value: 'assigned_to', label: 'Assigned To' },
          { value: 'assigned_by', label: 'Assigned By' },
          { value: 'created_by', label: 'Created By' },
        ];
      case 'incidents':
        return [
          { value: 'assigned_to_admin', label: 'Assigned Admin' },
          { value: 'created_by', label: 'Created By' },
        ];
      default:
        return [
          { value: 'created_by', label: 'Created By' },
        ];
    }
  };

  const recipientOptions = getRecipientOptions();

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
          placeholder="Enter template name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Source Table</Label>
        <Select
          value={formData.source_table}
          onValueChange={(value) => {
            // Reset recipient field when table changes
            onFormChange({ source_table: value, recipient_field: '' });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select table" />
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

      <div className="space-y-2">
        <Label>Email Recipient</Label>
        <Select
          value={formData.recipient_field}
          onValueChange={(value) => onFormChange({ recipient_field: value })}
          disabled={!formData.source_table}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            {recipientOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Active Status</Label>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => onFormChange({ is_active: checked })}
          />
          <span className="text-sm text-muted-foreground">
            {formData.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};