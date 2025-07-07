import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { JsonField } from '../types';

interface FieldFormProps {
  currentField: Partial<JsonField>;
  dropdownValues: string;
  editingFieldId: string | null;
  onFieldUpdate: (key: keyof JsonField, value: any) => void;
  onDropdownValuesChange: (value: string) => void;
  onAddField: () => void;
  onCancelEdit: () => void;
}

export const FieldForm: React.FC<FieldFormProps> = ({
  currentField,
  dropdownValues,
  editingFieldId,
  onFieldUpdate,
  onDropdownValuesChange,
  onAddField,
  onCancelEdit
}) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="fieldName">Field Name *</Label>
          <Input 
            id="fieldName" 
            value={currentField.name || ''} 
            onChange={e => onFieldUpdate('name', e.target.value)} 
            placeholder="e.g., Overall Appearance" 
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="fieldInfo">Field Info</Label>
          <Input 
            id="fieldInfo" 
            value={currentField.fieldInfo || ''} 
            onChange={e => onFieldUpdate('fieldInfo', e.target.value)} 
            placeholder="Information to display under the field..." 
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="fieldType">Field Type</Label>
          <Select value={currentField.type} onValueChange={value => onFieldUpdate('type', value as JsonField['type'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bold_gray">Bold and Grey</SelectItem>
              <SelectItem value="calculated">Calculated Field</SelectItem>
              <SelectItem value="dropdown">Dropdown</SelectItem>
              <SelectItem value="label">Label</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="penalty">Penalty</SelectItem>
              <SelectItem value="section_header">Section Header</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentField.type === 'text' && (
          <div className="space-y-1">
            <Label htmlFor="textType">Text Field Type</Label>
            <Select value={currentField.textType} onValueChange={value => onFieldUpdate('textType', value as 'short' | 'notes')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short Text (75 chars)</SelectItem>
                <SelectItem value="notes">Notes (2500 chars)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {currentField.type === 'dropdown' && (
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="dropdownValues">Dropdown Values (comma-separated)</Label>
            <Input 
              id="dropdownValues" 
              value={dropdownValues} 
              onChange={e => onDropdownValuesChange(e.target.value)} 
              placeholder="e.g., Excellent, Good, Fair, Poor" 
            />
          </div>
        )}

        {currentField.type === 'penalty' && currentField.penaltyType === 'checkbox_list' && (
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="checkboxValues">Checkbox List Values (comma-separated)</Label>
            <Input 
              id="checkboxValues" 
              value={dropdownValues} 
              onChange={e => onDropdownValuesChange(e.target.value)} 
              placeholder="e.g., Option 1, Option 2, Option 3" 
            />
          </div>
        )}

        {currentField.type === 'number' && (
          <div className="space-y-1">
            <Label htmlFor="maxValue">Max Value</Label>
            <Input 
              id="maxValue" 
              type="number" 
              value={currentField.maxValue || 100} 
              onChange={e => onFieldUpdate('maxValue', parseInt(e.target.value))} 
            />
          </div>
        )}

        {currentField.type === 'penalty' && (
          <>
            <div className="space-y-1">
              <Label htmlFor="penaltyType">Penalty Type</Label>
              <Select value={currentField.penaltyType} onValueChange={value => onFieldUpdate('penaltyType', value as 'points' | 'minor_major' | 'checkbox_list')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select penalty type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="minor_major">Minor/Major</SelectItem>
                  <SelectItem value="checkbox_list">Checkbox List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentField.penaltyType === 'points' && (
              <div className="space-y-1">
                <Label htmlFor="pointValue">Point Value</Label>
                <Input 
                  id="pointValue" 
                  type="number" 
                  value={currentField.pointValue || -10} 
                  onChange={e => onFieldUpdate('pointValue', parseInt(e.target.value))} 
                  placeholder="e.g., -10"
                />
              </div>
            )}
          </>
        )}

        <div className="flex items-center space-x-2">
          <Switch 
            id="pauseField" 
            checked={currentField.pauseField || false} 
            onCheckedChange={checked => onFieldUpdate('pauseField', checked)} 
          />
          <Label htmlFor="pauseField">Bold and Grey</Label>
        </div>
      </div>

      <Button type="button" onClick={onAddField} className="w-full" disabled={!currentField.name}>
        <Plus className="w-4 h-4 mr-2" />
        {editingFieldId ? 'Update Field' : 'Add Field'}
      </Button>
      
      {editingFieldId && (
        <Button type="button" variant="outline" onClick={onCancelEdit} className="w-full">
          Cancel Edit
        </Button>
      )}
    </div>
  );
};