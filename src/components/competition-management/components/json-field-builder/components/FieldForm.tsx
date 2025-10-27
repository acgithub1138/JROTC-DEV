import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
              <Select value={currentField.penaltyType} onValueChange={value => onFieldUpdate('penaltyType', value as 'points' | 'minor_major')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select penalty type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="minor_major">Minor (-20)/Major (-50)</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
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

            {currentField.penaltyType === 'split' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="splitFirstValue">1st Occurrence</Label>
                  <Input 
                    id="splitFirstValue" 
                    type="number" 
                    value={currentField.splitFirstValue || -5} 
                    onChange={e => onFieldUpdate('splitFirstValue', parseInt(e.target.value))} 
                    placeholder="e.g., -5"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="splitSubsequentValue">2+ Occurrences</Label>
                  <Input 
                    id="splitSubsequentValue" 
                    type="number" 
                    value={currentField.splitSubsequentValue || -25} 
                    onChange={e => onFieldUpdate('splitSubsequentValue', parseInt(e.target.value))} 
                    placeholder="e.g., -25"
                  />
                </div>
              </>
            )}
          </>
        )}

        {currentField.type !== 'bold_gray' && currentField.type !== 'section_header' && currentField.type !== 'text' && (
          <div className="flex items-center space-x-2">
            <Switch 
              id="pauseField" 
              checked={currentField.pauseField || false} 
              onCheckedChange={checked => onFieldUpdate('pauseField', checked)} 
            />
            <Label htmlFor="pauseField">Bold and Grey</Label>
          </div>
        )}
      </div>

      {/* Field Preview */}
      {currentField.name && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <div className="bg-background rounded-md p-3 border">
            {currentField.type === 'section_header' && (
              <h3 className="text-lg font-bold text-primary">{currentField.name}</h3>
            )}
            
            {(currentField.type === 'label' || currentField.type === 'bold_gray') && (
              <div>
                <p className={currentField.type === 'bold_gray' ? 'font-bold text-muted-foreground' : 'text-foreground'}>
                  {currentField.name}
                </p>
                {currentField.fieldInfo && (
                  <p className="text-xs text-muted-foreground mt-1">{currentField.fieldInfo}</p>
                )}
              </div>
            )}
            
            {currentField.type === 'text' && (
              <div className="space-y-1">
                <Label className={currentField.pauseField ? 'font-bold text-muted-foreground' : ''}>
                  {currentField.name}
                </Label>
                {currentField.textType === 'notes' ? (
                  <Textarea placeholder="Notes..." disabled className="resize-none" />
                ) : (
                  <Input placeholder="Short text..." disabled />
                )}
                {currentField.fieldInfo && (
                  <p className="text-xs text-muted-foreground">{currentField.fieldInfo}</p>
                )}
              </div>
            )}
            
            {currentField.type === 'number' && (
              <div className="space-y-1">
                <Label className={currentField.pauseField ? 'font-bold text-muted-foreground' : ''}>
                  {currentField.name}
                </Label>
                <Input type="number" placeholder={`Max: ${currentField.maxValue || 100}`} disabled />
                {currentField.fieldInfo && (
                  <p className="text-xs text-muted-foreground">{currentField.fieldInfo}</p>
                )}
              </div>
            )}
            
            {currentField.type === 'dropdown' && (
              <div className="space-y-1">
                <Label className={currentField.pauseField ? 'font-bold text-muted-foreground' : ''}>
                  {currentField.name}
                </Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                </Select>
                {currentField.fieldInfo && (
                  <p className="text-xs text-muted-foreground">{currentField.fieldInfo}</p>
                )}
              </div>
            )}
            
            {currentField.type === 'penalty' && (
              <div className="space-y-1">
                <Label className="text-destructive font-medium">{currentField.name}</Label>
                {currentField.penaltyType === 'points' && (
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="0" disabled className="w-20" />
                    <span className="text-sm text-muted-foreground">× {currentField.pointValue || -10} pts</span>
                  </div>
                )}
                {currentField.penaltyType === 'minor_major' && (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select penalty..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor (-20)</SelectItem>
                      <SelectItem value="major">Major (-50)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {currentField.penaltyType === 'split' && (
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="0" disabled className="w-20" />
                    <span className="text-sm text-muted-foreground">
                      1st: {currentField.splitFirstValue || -5} pts, 2+: {currentField.splitSubsequentValue || -25} pts
                    </span>
                  </div>
                )}
                {currentField.fieldInfo && (
                  <p className="text-xs text-muted-foreground">{currentField.fieldInfo}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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