import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
interface JsonField {
  id: string;
  name: string;
  type: 'text' | 'dropdown' | 'number';
  textType?: 'short' | 'notes'; // For text fields
  values?: string[];
  maxValue?: number; // For number fields
  penalty: boolean;
}
interface JsonFieldBuilderProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}
export const JsonFieldBuilder: React.FC<JsonFieldBuilderProps> = ({
  value,
  onChange
}) => {
  const [fields, setFields] = useState<JsonField[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentField, setCurrentField] = useState<Partial<JsonField>>({
    name: '',
    type: 'text',
    textType: 'short',
    values: [],
    maxValue: 100,
    penalty: false
  });
  const [dropdownValues, setDropdownValues] = useState('');
  const addField = () => {
    if (!currentField.name) return;
    const newField: JsonField = {
      id: Date.now().toString(),
      name: currentField.name,
      type: currentField.type || 'text',
      textType: currentField.textType || 'short',
      maxValue: currentField.maxValue || 100,
      penalty: currentField.penalty || false,
      ...(currentField.type === 'dropdown' && {
        values: dropdownValues.split(',').map(v => v.trim()).filter(v => v)
      })
    };
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    updateJson(updatedFields);

    // Reset form
    setCurrentField({
      name: '',
      type: 'text',
      textType: 'short',
      values: [],
      maxValue: 100,
      penalty: false
    });
    setDropdownValues('');
  };
  const removeField = (id: string) => {
    const updatedFields = fields.filter(f => f.id !== id);
    setFields(updatedFields);
    updateJson(updatedFields);
  };
  const updateJson = (fieldList: JsonField[]) => {
    const jsonStructure = {
      criteria: fieldList.map(field => ({
        name: field.name,
        type: field.type,
        maxLength: field.type === 'text' ? (field.textType === 'notes' ? 2500 : 75) : undefined,
        maxValue: field.type === 'number' ? field.maxValue : undefined,
        penalty: field.penalty,
        ...(field.values && {
          options: field.values
        })
      }))
    };
    onChange(jsonStructure);
  };
  const updateCurrentField = (key: keyof JsonField, value: any) => {
    setCurrentField(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const jsonPreview = JSON.stringify(value, null, 2);
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Score Sheet Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name *</Label>
              <Input id="fieldName" value={currentField.name || ''} onChange={e => updateCurrentField('name', e.target.value)} placeholder="e.g., Overall Appearance" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type</Label>
              <Select value={currentField.type} onValueChange={value => updateCurrentField('type', value as JsonField['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentField.type === 'text' && <div className="space-y-2">
                <Label htmlFor="textType">Text Field Type</Label>
                <Select value={currentField.textType} onValueChange={value => updateCurrentField('textType', value as 'short' | 'notes')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short Text (75 chars)</SelectItem>
                    <SelectItem value="notes">Notes (2500 chars)</SelectItem>
                  </SelectContent>
                </Select>
              </div>}

            {currentField.type === 'dropdown' && <div className="space-y-2 md:col-span-2">
                <Label htmlFor="dropdownValues">Dropdown Values (comma-separated)</Label>
                <Input id="dropdownValues" value={dropdownValues} onChange={e => setDropdownValues(e.target.value)} placeholder="e.g., Excellent, Good, Fair, Poor" />
              </div>}

            {currentField.type === 'number' && <div className="space-y-2">
                <Label htmlFor="maxValue">Max Value</Label>
                <Input id="maxValue" type="number" value={currentField.maxValue || 100} onChange={e => updateCurrentField('maxValue', parseInt(e.target.value))} />
              </div>}

            <div className="flex items-center space-x-2">
              <Switch id="penalty" checked={currentField.penalty || false} onCheckedChange={checked => updateCurrentField('penalty', checked)} />
              <Label htmlFor="penalty">Penalty Field</Label>
            </div>
          </div>

          <Button onClick={addField} className="w-full" disabled={!currentField.name}>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </CardContent>
      </Card>

      {fields.length > 0 && <Card>
          <CardHeader>
            <CardTitle>Added Fields ({fields.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields.map(field => <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <span className="font-medium">{field.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({field.type}
                      {field.type === 'text' && `, ${field.textType === 'notes' ? '2500' : '75'} chars`}
                      {field.type === 'number' && `, max: ${field.maxValue}`}
                      {field.penalty && ', penalty'}
                      {field.values && `, ${field.values.length} options`})
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => removeField(field.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>)}
            </div>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span>JSON Preview</span>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <Textarea value={jsonPreview} readOnly className="font-mono text-sm min-h-[200px]" />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>
    </div>;
};