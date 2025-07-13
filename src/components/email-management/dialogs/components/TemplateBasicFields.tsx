import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface TemplateBasicFieldsProps {
  formData: {
    name: string;
    source_table: string;
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
  return (
    <div className="grid grid-cols-3 gap-4">
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
          onValueChange={(value) => onFormChange({ source_table: value })}
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